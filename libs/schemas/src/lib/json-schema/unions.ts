import { type LiteralValue } from './expressions.js';
import { type JsonSchema } from './types.js';

/** What the discriminator search needs to know about one branch of a union. */
export type UnionBranchInfo = {
  /** The normalized branch schema. */
  schema: JsonSchema;
  /** The `$ref` the branch was written as, for OpenAPI `discriminator.mapping`. */
  ref?: string;
  /** The definition name of the branch, the OpenAPI value when there is no mapping. */
  defName?: string;
};

/** The property that tells the branches apart, with the value of each branch in order. */
export type Discriminator = { property: string; values: LiteralValue[] };

/**
 * Finds the discriminator of a union of object branches.
 *
 * With OpenAPI `discriminator.propertyName` on the union schema, each branch value is the
 * `const` of that property, otherwise the `discriminator.mapping` key that points to the branch
 * `$ref`, otherwise the branch definition name. Without it, the discriminator is the first
 * property of the first branch that has a `const` (or a one-value `enum`) in every branch.
 * The values must be distinct.
 *
 * @returns The discriminator, or `undefined` when the branches cannot be told apart.
 *
 * @example
 * discriminatorOf({}, [
 *   { schema: { properties: { method: { const: 'card' } } } },
 *   { schema: { properties: { method: { const: 'bank' } } } },
 * ]) // { property: 'method', values: ['card', 'bank'] }
 */
export function discriminatorOf(
  unionSchema: JsonSchema,
  branches: UnionBranchInfo[],
): Discriminator | undefined {
  const openApi = unionSchema['discriminator'];
  if (isRecord(openApi) && typeof openApi['propertyName'] === 'string') {
    const property = openApi['propertyName'];
    const mapping = isRecord(openApi['mapping']) ? openApi['mapping'] : {};
    const values = branches.map(
      (branch) =>
        constOf(propertyOf(branch.schema, property)) ??
        Object.keys(mapping).find((key) => mapping[key] === branch.ref) ??
        branch.defName,
    );
    return distinctValues(values) ? { property, values } : undefined;
  }

  const firstProperties = branches[0] ? propertiesOf(branches[0].schema) : {};
  for (const property of Object.keys(firstProperties)) {
    const values = branches.map((branch) => constOf(propertyOf(branch.schema, property)));
    if (distinctValues(values)) {
      return { property, values };
    }
  }
  return undefined;
}

function distinctValues(values: (LiteralValue | undefined)[]): values is LiteralValue[] {
  return values.every((value) => value !== undefined) && new Set(values).size === values.length;
}

/** The literal a property schema fixes with `const` or a one-value `enum`. */
function constOf(schema: unknown): LiteralValue | undefined {
  if (!isRecord(schema)) {
    return undefined;
  }
  const value =
    'const' in schema
      ? schema['const']
      : Array.isArray(schema['enum']) && schema['enum'].length === 1
        ? schema['enum'][0]
        : undefined;
  return isLiteral(value) ? value : undefined;
}

function propertiesOf(schema: JsonSchema): Record<string, unknown> {
  return isRecord(schema['properties']) ? schema['properties'] : {};
}

function propertyOf(schema: JsonSchema, property: string): unknown {
  return propertiesOf(schema)[property];
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
