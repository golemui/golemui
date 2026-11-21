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
