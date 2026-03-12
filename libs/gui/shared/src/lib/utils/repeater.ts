/**
 * Returns a stable unique key for a repeater data item.
 * Assigns a non-enumerable `__rid` property on first access so the ID
 * survives array operations (splice, filter, spread) without polluting
 * serialised output (JSON.stringify, Object.keys).
 *
 * @param idIncrementer function that increments the lexically-scoped id.
 */
export function getItemKey(item: Record<string, unknown>, idIncrementer: () => number): number {
  if (item != null && typeof item === 'object' && '__rid' in item) {
    return item['__rid'] as number;
  }
  const id = idIncrementer();
  Object.defineProperty(item, '__rid', {
    value: id,
    enumerable: false,
    configurable: false,
  });
  return id;
}
