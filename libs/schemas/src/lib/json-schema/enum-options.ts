import { humanize } from './text.js';
import { type EnumOption, type SchemaNode } from './types.js';

type OptionValue = EnumOption['value'];

/**
 * The options of an enumeration node, `undefined` when the node is not one. Two forms count:
 * `enum` (labels from `enumNames` when present, the RJSF convention), and a `oneOf`/`anyOf`
 * whose branches are all `const` (labels from each branch `title`). Other labels are the value
 * in readable form.
 *
 * @example
 * // { oneOf: [{ const: 'sm', title: 'Small' }, { const: 'lg' }] }
 * // -> [{ label: 'Small', value: 'sm' }, { label: 'Lg', value: 'lg' }]
 */
export function enumOptionsOf(node: SchemaNode): EnumOption[] | undefined {
  const { schema } = node;
  if (Array.isArray(schema['enum'])) {
    const names = Array.isArray(schema['enumNames']) ? schema['enumNames'] : [];
    const options: EnumOption[] = [];
    schema['enum'].forEach((value, index) => {
      if (isOptionValue(value)) {
        const name = names[index];
        options.push({ label: typeof name === 'string' ? name : labelOf(value), value });
      }
    });
    return options;
  }
  for (const keyword of ['oneOf', 'anyOf']) {
    const branches = schema[keyword];
    if (isConstUnion(branches)) {
      return (branches as Record<string, unknown>[])
        .filter((branch) => isOptionValue(branch['const']))
        .map((branch) => ({
          label: typeof branch['title'] === 'string' ? branch['title'] : labelOf(branch['const']),
          value: branch['const'] as OptionValue,
        }));
    }
  }
  return undefined;
}

/** True for a `oneOf`/`anyOf` made only of `const` branches, the labelled enum pattern. */
export function isConstUnion(branches: unknown): boolean {
  return Array.isArray(branches) && branches.length > 0 && branches.every(isConstBranch);
}

function isConstBranch(branch: unknown): branch is Record<string, unknown> {
  return branch !== null && typeof branch === 'object' && 'const' in branch;
}

function isOptionValue(value: unknown): value is Exclude<OptionValue, null> {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function labelOf(value: unknown): string {
  return typeof value === 'string' ? humanize(value) : String(value);
}
