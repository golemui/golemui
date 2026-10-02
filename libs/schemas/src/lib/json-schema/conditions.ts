import { equalsAny, literal, type LiteralValue } from './expressions.js';

/**
 * An `if` schema written as a reactive expression, or the keyword that has no expression
 * equivalent.
 */
export type CompiledCondition =
  | {
      expression: string;
      /** True when a tested property passes by being absent, see {@link compileCondition}. */
      vacuous: boolean;
      /** The top-level property names the condition reads. */
      reads: string[];
    }
  | { unsupported: string };

/** Reads a property relative to the object that holds the `if`, e.g. `['address', 'country']`. */
export type ReferenceFor = (segments: string[]) => string;

// Keywords that do not constrain the value.
const ANNOTATIONS = new Set([
  'title',
  'description',
  '$comment',
  'examples',
  'default',
  'deprecated',
]);

type ValueTest = { test: string; impliesPresence: boolean } | { unsupported: string };
type ObjectTests = { tests: string[] } | { unsupported: string };

/**
 * Compiles the subset of `if` schemas that has an expression equivalent: `true`, `false`,
 * `properties`, `required`, and per property `const`, `enum`, `not` of `const` or `enum`,
 * `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` and nested `properties`.
 * `type` is not checked, the data has the declared type.
 *
 * As in JSON Schema, a tested property that is not in `required` passes when it is absent,
 * which is `vacuous` in the result.
 *
 * @example
 * compileCondition(
 *   { properties: { country: { const: 'US' } }, required: ['country'] },
 *   (segments) => `$form.${segments.join('?.')}`,
 * )
 * // { expression: '$form.country === "US"', vacuous: false, reads: ['country'] }
 */
export function compileCondition(schema: unknown, reference: ReferenceFor): CompiledCondition {
  if (typeof schema === 'boolean') {
    return { expression: String(schema), vacuous: false, reads: [] };
  }
  if (!isRecord(schema)) {
    return { unsupported: 'a value that is not a schema' };
  }
  const state = { vacuous: false };
  const compiled = objectTests(schema, [], reference, state);
  if ('unsupported' in compiled) {
    return compiled;
  }
  const properties = isRecord(schema['properties']) ? Object.keys(schema['properties']) : [];
  const reads = [...new Set([...properties, ...requiredNames(schema)])];
  return { expression: joinAnd(compiled.tests), vacuous: state.vacuous, reads };
}

function objectTests(
  schema: Record<string, unknown>,
  basePath: string[],
  reference: ReferenceFor,
  state: { vacuous: boolean },
): ObjectTests {
  for (const [keyword, value] of Object.entries(schema)) {
    const constrainsNothing =
      keyword === 'properties' ||
      keyword === 'required' ||
      ANNOTATIONS.has(keyword) ||
      (keyword === 'type' && value === 'object');
    if (!constrainsNothing) {
      return { unsupported: keyword };
    }
  }
  const required = requiredNames(schema);
  const properties = isRecord(schema['properties']) ? schema['properties'] : {};
  const tests: string[] = [];

  for (const [name, subschema] of Object.entries(properties)) {
    const segments = [...basePath, name];
    const ref = reference(segments);
    const compiled = valueTest(subschema, segments, reference, state);
    if ('unsupported' in compiled) {
      return compiled;
    }
    if (required.includes(name)) {
      tests.push(
        compiled.impliesPresence ? compiled.test : `${ref} !== undefined && ${compiled.test}`,
      );
    } else if (compiled.test !== 'true') {
      tests.push(`(${ref} === undefined || ${compiled.test})`);
      state.vacuous = true;
    }
  }
  for (const name of required) {
    if (!(name in properties)) {
      tests.push(`${reference([...basePath, name])} !== undefined`);
    }
  }
  return { tests };
}

function valueTest(
  schema: unknown,
  segments: string[],
  reference: ReferenceFor,
  state: { vacuous: boolean },
): ValueTest {
  if (schema === true) {
    return { test: 'true', impliesPresence: false };
  }
  if (schema === false) {
    return { test: 'false', impliesPresence: true };
  }
  if (!isRecord(schema)) {
    return { unsupported: 'a value that is not a schema' };
  }

  const ref = reference(segments);
  const tests: string[] = [];
  let impliesPresence = false;
  for (const [keyword, value] of Object.entries(schema)) {
    if (
      keyword === 'type' ||
      keyword === 'properties' ||
      keyword === 'required' ||
      ANNOTATIONS.has(keyword)
    ) {
      continue;
    }
    if (keyword === 'const' && isLiteral(value)) {
      tests.push(`${ref} === ${literal(value)}`);
      impliesPresence ||= value !== null;
    } else if (keyword === 'enum' && Array.isArray(value) && value.every(isLiteral)) {
      tests.push(equalsAny(ref, value));
      impliesPresence ||= !value.includes(null);
    } else if (keyword === 'not' && negatedValues(value) !== undefined) {
      tests.push(`!(${equalsAny(ref, negatedValues(value) as LiteralValue[])})`);
    } else if (BOUND_OPERATORS[keyword] !== undefined && typeof value === 'number') {
      tests.push(`${ref} ${BOUND_OPERATORS[keyword]} ${value}`);
      impliesPresence = true;
    } else {
      return { unsupported: keyword };
    }
  }

  if ('properties' in schema || 'required' in schema) {
    const nested = objectTests(
      { properties: schema['properties'], required: schema['required'] },
      segments,
      reference,
      state,
    );
    if ('unsupported' in nested) {
      return nested;
    }
    tests.push(...nested.tests);
  }
  return { test: joinAnd(tests), impliesPresence };
}

const BOUND_OPERATORS: Record<string, string | undefined> = {
  minimum: '>=',
  maximum: '<=',
  exclusiveMinimum: '>',
  exclusiveMaximum: '<',
};

/** The values of `not: { const }` or `not: { enum }`, `undefined` for any other `not`. */
function negatedValues(schema: unknown): LiteralValue[] | undefined {
  if (!isRecord(schema) || Object.keys(schema).length !== 1) {
    return undefined;
  }
  if ('const' in schema && isLiteral(schema['const'])) {
    return [schema['const']];
  }
  if (Array.isArray(schema['enum']) && schema['enum'].every(isLiteral)) {
    return schema['enum'];
  }
  return undefined;
}

function joinAnd(tests: string[]): string {
  if (tests.length === 0) {
    return 'true';
  }
  return tests.join(' && ');
}

function requiredNames(schema: Record<string, unknown>): string[] {
  return Array.isArray(schema['required'])
    ? schema['required'].filter((name): name is string => typeof name === 'string')
    : [];
}

function isLiteral(value: unknown): value is LiteralValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
