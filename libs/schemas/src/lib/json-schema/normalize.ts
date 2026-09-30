import { declaredTypes, mergeSchemaParts, type SchemaPart } from './merge-schemas.js';
import { appendPointer, definitionNameOf, resolveRef } from './pointer.js';
import { type DiagnosticSeverity, type JsonSchema, type JsonType } from './types.js';

/** A conditional keyword of a node or of one of its `allOf` parts, compiled later by the walker. */
export type Conditional =
  | { kind: 'if'; if: unknown; then?: unknown; else?: unknown; pointer: string }
  | { kind: 'dependentRequired'; property: string; required: string[]; pointer: string }
  | { kind: 'dependentSchemas'; property: string; schema: unknown; pointer: string };

/** One schema node after normalization. */
export type NormalizedNode = {
  /**
   * The combined schema. `$ref`, `allOf`, the conditional keywords and `null` types are gone,
   * older draft keywords use their 2020-12 form, and `type` holds the single resolved type.
   */
  schema: JsonSchema;
  type?: JsonType;
  nullable: boolean;
  /** The definition name of the `$ref` the node came from, e.g. `Address`. */
  defName?: string;
  conditionals: Conditional[];
  /** The `$ref` values followed from the root down to this node, for the recursion limit. */
  refTrail: string[];
  /** The types the schema allows, `undefined` when it allows any type. */
  allowedTypes?: JsonType[];
};

/** A problem found while normalizing. The walker adds the form data path. */
export type NormalizeProblem = {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  pointer: string;
};

export type NormalizeEnvironment = {
  /** The document `$ref` values resolve against. */
  root: JsonSchema;
  /** How many times one `$ref` may repeat in a trail. */
  maxRefDepth: number;
  report(problem: NormalizeProblem): void;
  /**
   * Document pointers of the schema objects seen so far, so a child found through a merge or a
   * `$ref` can still point diagnostics at its place in the input.
   */
  pointers: WeakMap<object, string>;
};

// Containers and identifiers that only matter for resolution, not for the form.
const RESOLUTION_ONLY_KEYWORDS = [
  '$defs',
  'definitions',
  '$schema',
  '$id',
  '$anchor',
  '$dynamicAnchor',
];

/**
 * Normalizes one schema node, see {@link NormalizedNode}. Only the node itself is resolved:
 * its `$ref`, its `allOf` parts and a nullable `oneOf`/`anyOf` pair. Properties and items stay
 * as they are, and the walker normalizes them when it reaches them.
 *
 * @param raw - The schema as written in the input, a schema object or a boolean.
 * @param pointer - JSON pointer of `raw` in the input document.
 * @param refTrail - The `$ref` values followed from the root down to the parent.
 * @returns The normalized node, or `undefined` when the node is not rendered: a `false` schema,
 *   a `$ref` that cannot be resolved or repeats too often, or a value that is not a schema. Each
 *   case except `false` is reported.
 *
 * @example
 * const node = normalizeNode({ $ref: '#/$defs/Address', title: 'Shipping' }, '/properties/shipping', [], environment);
 * node.defName // 'Address'
 * node.schema.title // 'Shipping', the keywords next to `$ref` win
 */
export function normalizeNode(
  raw: unknown,
  pointer: string,
  refTrail: readonly string[],
  environment: NormalizeEnvironment,
): NormalizedNode | undefined {
  if (raw === false) {
    return undefined;
  }
  if (raw === true || raw === undefined) {
    return { schema: {}, nullable: false, conditionals: [], refTrail: [...refTrail] };
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    environment.report({
      severity: 'error',
      code: 'invalid-schema',
      message: 'This value is not a JSON Schema object or boolean.',
      pointer,
    });
    return undefined;
  }

  registerSubschemaPointers(raw as JsonSchema, pointer, environment.pointers);
  const own = rewriteDraftKeywords(raw as JsonSchema, pointer);
  let trail = [...refTrail];
  let explicitNull = own.nullableKeyword;
  let defName: string | undefined;
  const conditionals = [...own.conditionals];
  const ownPart: SchemaPart = {
    schema: own.schema,
    pointer,
    allowedTypes: withNull(declaredTypes(own.schema), own.nullableKeyword),
  };
  const parts: SchemaPart[] = [ownPart];

  // Every part starts from the incoming trail, so sibling parts never count each other's refs.
  // The children of the node inherit the refs of all parts.
  const addPart = (node: NormalizedNode, partPointer: string, allowsNull = false) => {
    parts.push({
      schema: node.schema,
      pointer: partPointer,
      allowedTypes: withNull(node.allowedTypes, allowsNull),
    });
    conditionals.push(...node.conditionals);
    trail = [...trail, ...node.refTrail.slice(refTrail.length)];
  };

  const ref = own.schema['$ref'];
  delete own.schema['$ref'];
  if (typeof ref === 'string') {
    const followed = followRef(ref, pointer, [...refTrail], environment);
    if (followed === undefined) {
      return undefined;
    }
    addPart(followed.node, followed.pointer);
    defName = definitionNameOf(followed.pointer) ?? followed.node.defName;
  }

  const allOf = own.schema['allOf'];
  delete own.schema['allOf'];
  if (Array.isArray(allOf)) {
    const nodes = allOf.map((branch, index) => {
      const branchPointer = appendPointer(pointer, 'allOf', index);
      const node = normalizeNode(branch, branchPointer, refTrail, environment);
      if (node !== undefined) {
        addPart(node, branchPointer);
      }
      return node;
    });
    // `allOf: [{ $ref }]` next to a description is how OpenAPI 3.0 annotates a reference.
    if (nodes.length === 1) {
      defName ??= nodes[0]?.defName;
    }
  }

  const pair = nullablePair(own.schema);
  if (pair !== undefined) {
    delete own.schema[pair.keyword];
    const pairPointer = appendPointer(pointer, pair.keyword, pair.index);
    const node = normalizeNode(pair.branch, pairPointer, refTrail, environment);
    if (node === undefined) {
      return undefined;
    }
    addPart(node, pairPointer, true);
    explicitNull = true;
    defName ??= node.defName;
  }

  const merged = mergeSchemaParts(parts, environment.pointers);
  for (const conflict of merged.conflicts) {
    environment.report({
      severity: 'warning',
      code: 'allof-conflict',
      message: `The combined schemas disagree on \`${conflict.keyword}\`. The first value is used.`,
      pointer: conflict.pointer,
    });
  }

  const schema = merged.schema;
  if (Array.isArray(schema['enum']) && schema['enum'].includes(null)) {
    schema['enum'] = schema['enum'].filter((option) => option !== null);
    explicitNull = true;
  }
  const resolved = resolveType(merged.allowedTypes, schema, pointer, environment);
  if (resolved.type === undefined) {
    delete schema['type'];
  } else {
    schema['type'] = resolved.type;
  }

  return {
    schema,
    type: resolved.type,
    nullable: explicitNull || resolved.nullable,
    defName,
    conditionals,
    refTrail: trail,
    allowedTypes: merged.allowedTypes,
  };
}

function followRef(
  ref: string,
  pointer: string,
  trail: string[],
  environment: NormalizeEnvironment,
): { node: NormalizedNode; pointer: string } | undefined {
  const repetitions = trail.filter((entry) => entry === ref).length;
  if (repetitions >= environment.maxRefDepth) {
    environment.report({
      severity: 'warning',
      code: 'recursive-ref',
      message: `"${ref}" repeats ${repetitions} times on this branch, so the form stops here.`,
      pointer,
    });
    return undefined;
  }
  const resolved = resolveRef(ref, environment.root);
  if ('error' in resolved) {
    environment.report({
      severity: 'error',
      code: 'unresolved-ref',
      message: resolved.error,
      pointer,
    });
    return undefined;
  }
  if (resolved.target !== null && typeof resolved.target === 'object') {
    if (!environment.pointers.has(resolved.target)) {
      environment.pointers.set(resolved.target, resolved.pointer);
    }
  }
  const node = normalizeNode(resolved.target, resolved.pointer, [...trail, ref], environment);
  return node === undefined ? undefined : { node, pointer: resolved.pointer };
}

/**
 * Copies the node's own keywords and rewrites the older draft forms: draft-07 `dependencies`
 * and tuple `items`, draft-04 boolean `exclusiveMinimum`/`exclusiveMaximum`, and the OpenAPI 3.0
 * `nullable` and `example`. The conditional keywords move out of the schema.
 */
function rewriteDraftKeywords(
  raw: JsonSchema,
  pointer: string,
): { schema: JsonSchema; conditionals: Conditional[]; nullableKeyword: boolean } {
  const schema: JsonSchema = { ...raw };
  const conditionals: Conditional[] = [];
  for (const keyword of RESOLUTION_ONLY_KEYWORDS) {
    delete schema[keyword];
  }

  if ('if' in schema) {
    conditionals.push({
      kind: 'if',
      if: schema['if'],
      then: schema['then'],
      else: schema['else'],
      pointer,
    });
  }
  delete schema['if'];
  delete schema['then'];
  delete schema['else'];

  // Draft-07 `dependencies` holds both forms that 2019-09 split in two keywords.
  for (const keyword of ['dependentRequired', 'dependentSchemas', 'dependencies']) {
    const entries = schema[keyword];
    delete schema[keyword];
    if (entries === null || typeof entries !== 'object' || Array.isArray(entries)) {
      continue;
    }
    for (const [property, value] of Object.entries(entries)) {
      const entryPointer = appendPointer(pointer, keyword, property);
      if (Array.isArray(value)) {
        if (keyword !== 'dependentSchemas') {
          const required = value.filter((name): name is string => typeof name === 'string');
          conditionals.push({
            kind: 'dependentRequired',
            property,
            required,
            pointer: entryPointer,
          });
        }
      } else if (keyword !== 'dependentRequired') {
        conditionals.push({
          kind: 'dependentSchemas',
          property,
          schema: value,
          pointer: entryPointer,
        });
      }
    }
  }

  // Draft-07 tuple: `items` as an array, and `additionalItems` for the rest.
  if (Array.isArray(schema['items'])) {
    schema['prefixItems'] ??= schema['items'];
    delete schema['items'];
    if ('additionalItems' in schema) {
      schema['items'] = schema['additionalItems'];
    }
  }
  delete schema['additionalItems'];

  // Draft-04: a boolean that makes `minimum`/`maximum` exclusive.
  for (const [exclusive, bound] of [
    ['exclusiveMinimum', 'minimum'],
    ['exclusiveMaximum', 'maximum'],
  ]) {
    if (schema[exclusive] === true && typeof schema[bound] === 'number') {
      schema[exclusive] = schema[bound];
      delete schema[bound];
    } else if (typeof schema[exclusive] === 'boolean') {
      delete schema[exclusive];
    }
  }

  if ('example' in schema) {
    schema['examples'] ??= [schema['example']];
    delete schema['example'];
  }
  const nullableKeyword = schema['nullable'] === true;
  delete schema['nullable'];

  return { schema, conditionals, nullableKeyword };
}

/**
 * A two-branch `oneOf` or `anyOf` where one branch only allows `null`. That is how
 * OpenAPI 3.1 and most generators write a nullable reference, so it only makes the node nullable.
 */
function nullablePair(
  schema: JsonSchema,
): { keyword: 'oneOf' | 'anyOf'; branch: unknown; index: number } | undefined {
  for (const keyword of ['oneOf', 'anyOf'] as const) {
    const branches = schema[keyword];
    if (!Array.isArray(branches) || branches.length !== 2) {
      continue;
    }
    const nullIndex = branches.findIndex(onlyAllowsNull);
    if (nullIndex !== -1 && !onlyAllowsNull(branches[1 - nullIndex])) {
      return { keyword, branch: branches[1 - nullIndex], index: 1 - nullIndex };
    }
  }
  return undefined;
}

function onlyAllowsNull(schema: unknown): boolean {
  if (schema === null || typeof schema !== 'object') {
    return false;
  }
  const keywords = schema as JsonSchema;
  return (
    keywords['type'] === 'null' ||
    keywords['const'] === null ||
    (Array.isArray(keywords['enum']) &&
      keywords['enum'].length === 1 &&
      keywords['enum'][0] === null)
  );
}

function withNull(types: JsonType[] | undefined, addNull: boolean): JsonType[] | undefined {
  if (types === undefined || !addNull || types.includes('null')) {
    return types;
  }
  return [...types, 'null'];
}

function resolveType(
  allowedTypes: JsonType[] | undefined,
  schema: JsonSchema,
  pointer: string,
  environment: NormalizeEnvironment,
): { type?: JsonType; nullable: boolean } {
  if (allowedTypes === undefined) {
    return { type: inferType(schema), nullable: false };
  }
  const nonNull = allowedTypes.filter((type) => type !== 'null');
  // `integer` was only added to intersect with `number`, which already covers it.
  const distinct = nonNull.includes('number')
    ? nonNull.filter((type) => type !== 'integer')
    : nonNull;
  if (distinct.length === 0) {
    return { type: 'null', nullable: false };
  }
  if (distinct.length > 1) {
    environment.report({
      severity: 'warning',
      code: 'multi-type',
      message: `The schema allows several types (${distinct.join(', ')}). The form uses the first one, ${distinct[0]}.`,
      pointer,
    });
  }
  return { type: distinct[0], nullable: allowedTypes.includes('null') };
}

const STRING_KEYWORDS = ['format', 'pattern', 'minLength', 'maxLength'];
const NUMBER_KEYWORDS = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
];

/** The type a schema without `type` implies through its other keywords, if any. */
function inferType(schema: JsonSchema): JsonType | undefined {
  if (
    ['properties', 'additionalProperties', 'patternProperties', 'required'].some((k) => k in schema)
  ) {
    return 'object';
  }
  if ('items' in schema || 'prefixItems' in schema) {
    return 'array';
  }
  const values =
    'const' in schema
      ? [schema['const']]
      : Array.isArray(schema['enum'])
        ? schema['enum']
        : (constValues(schema['oneOf']) ?? constValues(schema['anyOf']));
  if (values !== undefined && values.length > 0) {
    const types = [...new Set(values.map(typeOfValue))];
    if (types.every((type) => type === 'integer' || type === 'number')) {
      return types.includes('number') ? 'number' : 'integer';
    }
    return types.length === 1 ? types[0] : undefined;
  }
  if (STRING_KEYWORDS.some((keyword) => keyword in schema)) {
    return 'string';
  }
  if (NUMBER_KEYWORDS.some((keyword) => keyword in schema)) {
    return 'number';
  }
  return undefined;
}

/** The values of a `oneOf`/`anyOf` whose branches are all `const`, the labelled enum pattern. */
function constValues(branches: unknown): unknown[] | undefined {
  if (!Array.isArray(branches) || branches.length === 0) {
    return undefined;
  }
  const values: unknown[] = [];
  for (const branch of branches) {
    if (branch === null || typeof branch !== 'object' || !('const' in branch)) {
      return undefined;
    }
    values.push((branch as JsonSchema)['const']);
  }
  return values;
}

function typeOfValue(value: unknown): JsonType {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  return 'object';
}

const SINGLE_SUBSCHEMA_KEYWORDS = [
  'additionalProperties',
  'additionalItems',
  'items',
  'contains',
  'not',
  'if',
  'then',
  'else',
  'propertyNames',
];
const SUBSCHEMA_LIST_KEYWORDS = ['allOf', 'anyOf', 'oneOf', 'prefixItems', 'items'];
const SUBSCHEMA_MAP_KEYWORDS = [
  'properties',
  'patternProperties',
  'dependentSchemas',
  'dependencies',
];

/** Records the document pointer of every direct subschema of `schema`, first one wins. */
function registerSubschemaPointers(
  schema: JsonSchema,
  pointer: string,
  pointers: WeakMap<object, string>,
): void {
  const register = (value: unknown, valuePointer: string) => {
    if (value !== null && typeof value === 'object' && !pointers.has(value)) {
      pointers.set(value, valuePointer);
    }
  };
  for (const keyword of SINGLE_SUBSCHEMA_KEYWORDS) {
    if (!Array.isArray(schema[keyword])) {
      register(schema[keyword], appendPointer(pointer, keyword));
    }
  }
  for (const keyword of SUBSCHEMA_LIST_KEYWORDS) {
    const list = schema[keyword];
    if (Array.isArray(list)) {
      list.forEach((value, index) => register(value, appendPointer(pointer, keyword, index)));
    }
  }
  for (const keyword of SUBSCHEMA_MAP_KEYWORDS) {
    const map = schema[keyword];
    if (map !== null && typeof map === 'object' && !Array.isArray(map)) {
      for (const [name, value] of Object.entries(map)) {
        register(value, appendPointer(pointer, keyword, name));
      }
    }
  }
}
