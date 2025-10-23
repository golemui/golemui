/**
 * Checks whether a value is a JavaScript literal (primitive), excluding Symbol, null and undefined
 */
export function isLiteral(value: unknown): value is LiteralValue {
  const t = typeof value;
  return t === 'string' || t === 'number' || t === 'boolean' || t === 'bigint';
}
export type LiteralValue = string | number | boolean | bigint;
