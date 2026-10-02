import { type JsonSchema, type JsonType } from './types.js';

/** One schema taking part in a merge. `allowedTypes` is `undefined` when it allows any type. */
export type SchemaPart = {
  schema: JsonSchema;
  /** JSON pointer of the part, for conflict reports. */
  pointer: string;
  allowedTypes?: JsonType[];
};

/** A keyword whose values the parts cannot both satisfy. The first value is kept. */
export type MergeConflict = { keyword: string; pointer: string };

export type MergedSchema = {
  /** The combined keywords. `type` is not included, see `allowedTypes`. */
  schema: JsonSchema;
  allowedTypes?: JsonType[];
  conflicts: MergeConflict[];
};

const LOWER_BOUNDS = new Set([
  'minimum',
  'exclusiveMinimum',
  'minLength',
  'minItems',
  'minProperties',
  'minContains',
]);
const UPPER_BOUNDS = new Set([
  'maximum',
  'exclusiveMaximum',
  'maxLength',
  'maxItems',
  'maxProperties',
  'maxContains',
]);
// Keywords with no combined value when the parts disagree.
const MUST_AGREE = new Set([
  'const',
  'pattern',
  'format',
  'multipleOf',
  'prefixItems',
  'oneOf',
  'anyOf',
  'not',
  'contains',
]);
const SUBSCHEMA_MAPS = new Set(['properties', 'patternProperties']);

const CONFLICT = Symbol('conflict');

/**
 * Combines schema parts that all apply to the same value, as `allOf` requires. The first part
 * wins for annotations such as `title` and for every keyword with no rule below, so the part
 * that holds the `allOf` or the `$ref` goes first.
 *
 * - `type`: intersected, `number` includes `integer`.
 * - `required`: union. `enum`: intersection. `uniqueItems`: true when any part says so.
 * - Lower bounds take the highest value, upper bounds the lowest.
 * - `properties`, `patternProperties`: a property in several parts becomes `{ allOf: [...] }`,
 *   merged later when that property is normalized. The same for `items`.
 * - `const`, `pattern`, `format` and the other keywords in `MUST_AGREE` keep the first value and
 *   report a conflict when the parts differ.
 *
 * @param parts - The parts, the one that holds the `allOf` or the `$ref` first.
 * @param pointers - Document pointers of schema objects. A new `allOf` wrapper gets the pointer
 *   of its first member.
 */
export function mergeSchemaParts(
  parts: SchemaPart[],
  pointers: WeakMap<object, string>,
): MergedSchema {
  const schema: JsonSchema = {};
  const conflicts: MergeConflict[] = [];
  let allowedTypes: JsonType[] | undefined;

  for (const part of parts) {
    const typeIntersection = intersectTypes(allowedTypes, part.allowedTypes);
    if (typeIntersection === CONFLICT) {
      conflicts.push({ keyword: 'type', pointer: part.pointer });
    } else {
      allowedTypes = typeIntersection;
    }

    for (const [keyword, value] of Object.entries(part.schema)) {
      if (keyword === 'type') {
        continue;
      }
      if (!(keyword in schema)) {
        schema[keyword] = value;
        continue;
      }
      const combined = combineKeyword(keyword, schema[keyword], value, pointers);
      if (combined === CONFLICT) {
        conflicts.push({ keyword, pointer: part.pointer });
      } else {
        schema[keyword] = combined;
      }
    }
  }
  return { schema, allowedTypes, conflicts };
}

/**
 * The types a schema declares, with `integer` added wherever `number` is, so an intersection
 * with `integer` keeps it. `undefined` when the schema declares no type.
 */
export function declaredTypes(schema: JsonSchema): JsonType[] | undefined {
  const declared =
    typeof schema['type'] === 'string'
      ? [schema['type']]
      : Array.isArray(schema['type'])
        ? schema['type']
        : undefined;
  if (declared === undefined) {
    return undefined;
  }
  const types = declared.filter(isJsonType);
  if (types.includes('number') && !types.includes('integer')) {
    types.splice(types.indexOf('number') + 1, 0, 'integer');
  }
  return types;
}

function isJsonType(value: unknown): value is JsonType {
  return (
    value === 'string' ||
    value === 'number' ||
    value === 'integer' ||
    value === 'boolean' ||
    value === 'object' ||
    value === 'array' ||
    value === 'null'
  );
}

function intersectTypes(
  current: JsonType[] | undefined,
  next: JsonType[] | undefined,
): JsonType[] | undefined | typeof CONFLICT {
  if (next === undefined) {
    return current;
  }
  if (current === undefined) {
    return next;
  }
  const intersection = current.filter((type) => next.includes(type));
  return intersection.length > 0 ? intersection : CONFLICT;
}

function combineKeyword(
  keyword: string,
  existing: unknown,
  value: unknown,
  pointers: WeakMap<object, string>,
): unknown {
  if (jsonEqual(existing, value)) {
    return existing;
  }
  if (typeof existing === 'number' && typeof value === 'number') {
    if (LOWER_BOUNDS.has(keyword)) {
      return Math.max(existing, value);
    }
    if (UPPER_BOUNDS.has(keyword)) {
      return Math.min(existing, value);
    }
  }
  if (keyword === 'required' && Array.isArray(existing) && Array.isArray(value)) {
    return [...existing, ...value.filter((name) => !existing.includes(name))];
  }
  if (keyword === 'enum' && Array.isArray(existing) && Array.isArray(value)) {
    const intersection = existing.filter((option) =>
      value.some((other) => jsonEqual(option, other)),
    );
    return intersection.length > 0 ? intersection : CONFLICT;
  }
  if (keyword === 'uniqueItems') {
    return existing === true || value === true;
  }
  if (SUBSCHEMA_MAPS.has(keyword) && isObject(existing) && isObject(value)) {
    return mergeSubschemaMaps(existing, value, pointers);
  }
  if (keyword === 'items') {
    return allOfWrapper(existing, value, pointers);
  }
  if (MUST_AGREE.has(keyword)) {
    return CONFLICT;
  }
  return existing;
}

function mergeSubschemaMaps(
  existing: Record<string, unknown>,
  added: Record<string, unknown>,
  pointers: WeakMap<object, string>,
): Record<string, unknown> {
  const merged = { ...existing };
  for (const [name, subschema] of Object.entries(added)) {
    merged[name] = name in merged ? allOfWrapper(merged[name], subschema, pointers) : subschema;
  }
  return merged;
}

function allOfWrapper(first: unknown, second: unknown, pointers: WeakMap<object, string>): unknown {
  if (jsonEqual(first, second)) {
    return first;
  }
  const wrapper = { allOf: [first, second] };
  const firstPointer = isObject(first) ? pointers.get(first) : undefined;
  if (firstPointer !== undefined) {
    pointers.set(wrapper, firstPointer);
  }
  return wrapper;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Enough for schema values: they come from JSON, so key order is the only false negative.
function jsonEqual(first: unknown, second: unknown): boolean {
  return first === second || JSON.stringify(first) === JSON.stringify(second);
}
