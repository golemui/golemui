import { type SchemaNode } from './types.js';

/** A value a condition compares with. */
export type LiteralValue = string | number | boolean | null;

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Writes a value as an expression literal. Core rewrites `.<digit>` as an array index even
 * inside a string literal, so a string is split before such a digit.
 *
 * @example
 * literal('card') // '"card"'
 * literal('v1.2') // '"v1." + "2"'
 */
export function literal(value: LiteralValue): string {
  if (typeof value !== 'string') {
    return JSON.stringify(value);
  }
  return JSON.stringify(value).replace(/\.(?=\d)/g, '." + "');
}

/**
 * Writes an expression that reads a path below a scope variable. Every segment after the first
 * uses `?.`, so a missing parent reads as `undefined` instead of throwing. A segment that is not
 * an identifier uses brackets.
 *
 * @example
 * pathExpression('$form', ['payment', 'method']) // '$form.payment?.method'
 * pathExpression('$item', ['unit-price']) // '$item["unit-price"]'
 */
export function pathExpression(scope: '$form' | '$item', segments: string[]): string {
  return segments.reduce((expression, segment, index) => {
    const chain = index === 0 ? '' : '?.';
    if (IDENTIFIER.test(segment)) {
      return `${expression}${chain === '' ? '.' : chain}${segment}`;
    }
    return `${expression}${chain}[${literal(segment)}]`;
  }, scope);
}

/**
 * The innermost array item that holds `node`, the node itself included. Tuple positions do not
 * count, they are fixed fields and not repeated rows.
 */
export function innermostItemNode(node: SchemaNode): SchemaNode | undefined {
  for (let current: SchemaNode | undefined = node; current; current = current.parent) {
    const parent = current.parent;
    if (parent?.type === 'array' && current.path === `${parent.path}.items`) {
      return current;
    }
  }
  return undefined;
}

/**
 * Writes an expression that reads a form data path from a condition that belongs to `node`.
 * Inside a repeater row it reads through `$item`, the row the widget is rendered in, so every
 * row sees its own data. Outside a repeater it reads through `$form`.
 *
 * @param node - The node the condition belongs to.
 * @param path - The form data path to read. It must be at or below the row of `node`.
 *
 * @example
 * // node path 'payment', outside a repeater:
 * dataReference(node, 'payment.method') // '$form.payment?.method'
 * // node path 'lines.items', the item of the `lines` array:
 * dataReference(node, 'lines.items.method') // '$item.method'
 */
export function dataReference(node: SchemaNode, path: string): string {
  const row = innermostItemNode(node);
  if (row === undefined) {
    return pathExpression('$form', path.split('.'));
  }
  const relative = path.slice(row.path.length + 1);
  return relative === '' ? '$item' : pathExpression('$item', relative.split('.'));
}

/**
 * A condition that is true when `reference` equals one of `values`.
 *
 * @example
 * equalsAny('$form.kind', ['a', 'b']) // '($form.kind === "a" || $form.kind === "b")'
 */
export function equalsAny(reference: string, values: LiteralValue[]): string {
  const tests = values.map((value) => `${reference} === ${literal(value)}`);
  return tests.length === 1 ? tests[0] : `(${tests.join(' || ')})`;
}
