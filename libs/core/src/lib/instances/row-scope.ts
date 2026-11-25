import { ROW_INDEXES_SCOPE_KEY } from '../compile/compile-expression';
import { type ExpressionScope } from '../compile/compiled-form';
import { get } from '../utils/object';
import { innermostRowIndex, type WidgetInstance } from './widget-instance';

/**
 * Makes the scope that the expressions of the widgets of one repeater row read.
 *
 * @param scope - The scope around the repeater.
 * @param row - The instance of the row layout.
 * @param data - The form data. The item of the row is read from it.
 * @returns The scope with `$item` and `$index` of the row, and with the index of every row
 *   around its widgets, which a compiled condition of a row reads. In a row of a row, `$item`
 *   and `$index` are those of the innermost row.
 *
 * @example
 * ```ts
 * const rowScope = scopeOfRow(scope, repeater.rows[1], data);
 * // rowScope.$index is 1, and rowScope.$item is the second entry of the array of the repeater
 * ```
 */
export function scopeOfRow(
  scope: ExpressionScope,
  row: WidgetInstance,
  data: Record<string, any>,
): ExpressionScope {
  return {
    ...scope,
    $item: row.itemPath === undefined ? undefined : get(data, row.itemPath),
    $index: innermostRowIndex(row),
    [ROW_INDEXES_SCOPE_KEY]: row.rowIndexes,
  };
}
