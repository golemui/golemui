/**
 * @internal Used by framework Repeater components, not part of the end-user public API.
 *
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

/**
 * @internal Used by framework layout components, not part of the end-user public API.
 *
 * Returns the repeater row indexes a widget uid carries, as the string to append to a template
 * uid to address the same widget inside that row. Empty when the widget is not inside a repeater.
 *
 * Layout components need it because their children arrive from the store with the row indexes
 * already applied, while the uids in their own props (a tab's `uid`, an accordion section's
 * `uid`) come from the form definition and carry none.
 *
 * Only the trailing run of `[n]` groups counts, an index elsewhere in the uid is part of the name.
 *
 * @param uid - The layout widget's own uid.
 * @returns The index suffix, for example `[0]` or `[2][1]`, or an empty string.
 * @example
 * repeaterIndexSuffix('tabs[0]'); // '[0]'
 * repeaterIndexSuffix('tabs');    // ''
 */
export function repeaterIndexSuffix(uid: string): string {
  return uid.match(/(\[\d+\])+$/)?.[0] ?? '';
}
