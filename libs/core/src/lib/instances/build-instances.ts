import { type CompiledWidget, pathInRow } from '../compile/compiled-form';
import { type FormWidget, isInputWidget } from '../form-widget';
import { type DotPath, type Uid } from '../shared';
import { get } from '../utils/object';
import { toRepeaterItemUid } from '../utils/repeater';
import {
  hasSameInstances,
  innermostRowIndex,
  previousIfSameInstances,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

// One list for every instance without children or rows, so "no entries" is one object. Every
// form of the process shares the two lists, so they are frozen: a write into one throws.
const NO_INSTANCES: WidgetInstance[] = [];
const NO_ROW_INDEXES: number[] = [];
Object.freeze(NO_INSTANCES);
Object.freeze(NO_ROW_INDEXES);

/**
 * Builds the widget instances of a form for the current data: one for each widget outside a
 * repeater, and one for each widget of a row layout in each row of its repeater.
 *
 * An instance of the tree before is used again when the widget still exists. Only a repeater
 * whose rows changed gets a new instance, together with the widgets above it. So a build that
 * changes no row returns `previous` itself.
 *
 * @param compiledRoot - The compiled root layout. `undefined` gives a tree with no instance.
 * @param data - The form data. The array at the path of a repeater gives its rows.
 * @param previous - The tree of the build before. It must come from the same compiled form.
 * @param older - A tree that is older than `previous`. An instance of it is used again for a
 *   widget that `previous` does not have, and for a widget whose children and rows are its own
 *   again. The loop of the default values gives the tree of the last derive here. So a row that
 *   one build of the loop removes, and that the next build adds again, keeps its instance, and so
 *   does each widget above it when nothing else below that widget changed.
 * @returns The tree for the data. It is `previous` itself or `older` itself when that tree has
 *   every instance of the result.
 * @throws The error of a path that is not inside the row of its repeater, when a row has an
 *   input with that path.
 *
 * @example
 * ```ts
 * const first = buildWidgetInstances(compiled.root, { users: [{}] }, emptyWidgetInstanceTree());
 * const second = buildWidgetInstances(compiled.root, { users: [{ name: 'Ada' }] }, first);
 * // The data has the same rows, so `second` is the object `first`.
 * ```
 */
export function buildWidgetInstances(
  compiledRoot: CompiledWidget | undefined,
  data: Record<string, any>,
  previous: WidgetInstanceTree,
  older: WidgetInstanceTree = previous,
): WidgetInstanceTree {
  if (compiledRoot === undefined) {
    return previous.root === undefined ? previous : { root: undefined };
  }
  const root = buildInstance(
    compiledRoot,
    data,
    NO_ROW_INDEXES,
    undefined,
    previous.root,
    older.root,
  );
  if (root === previous.root) {
    return previous;
  }
  return root === older.root ? older : { root };
}

/**
 * @param rowIndexes - The index of each row around the widget, the outermost first.
 * @param itemPath - The data path of the innermost row around the widget.
 * @param previous - The instance of the same widget in the same row, from the build before.
 * @param older - The instance of the same widget in the same row, from the older tree.
 */
function buildInstance(
  widget: CompiledWidget,
  data: Record<string, any>,
  rowIndexes: number[],
  itemPath: DotPath | undefined,
  previous: WidgetInstance | undefined,
  older: WidgetInstance | undefined,
): WidgetInstance {
  // The uid, the path and the source depend only on the widget and its row, so the previous
  // instance has the right ones. A new instance is created before the instances below it, so
  // the error of its path comes before an error of a widget below it.
  const instance = previous ?? older ?? createInstance(widget, rowIndexes, itemPath);

  const children = previousIfSameInstances(
    instance.children,
    widget.children.map((child, position) =>
      buildInstance(
        child,
        data,
        rowIndexes,
        itemPath,
        instance.children[position],
        older?.children[position],
      ),
    ),
  );
  const rows = previousIfSameInstances(instance.rows, buildRows(widget, data, instance, older));

  if (children === instance.children && rows === instance.rows) {
    return instance;
  }
  // A row that one build of the loop of the default values removes, and the next build adds
  // again, is the instance of the older tree. So a widget above it can be its older instance too.
  if (
    older !== undefined &&
    older !== instance &&
    hasSameInstances(older.children, children) &&
    hasSameInstances(older.rows, rows)
  ) {
    return older;
  }
  return { ...instance, children, rows };
}

function createInstance(
  widget: CompiledWidget,
  rowIndexes: number[],
  itemPath: DotPath | undefined,
): WidgetInstance {
  const isInRow = rowIndexes.length > 0;
  const uid = isInRow ? toRepeaterItemUid(widget.source.uid, rowIndexes) : widget.source.uid;
  const path = pathOfInstance(widget, rowIndexes);
  return {
    uid,
    source: isInRow ? sourceInRow(widget.source, uid, path) : widget.source,
    path,
    rowIndexes,
    itemPath,
    children: NO_INSTANCES,
    rows: NO_INSTANCES,
    flags: undefined,
  };
}

function pathOfInstance(widget: CompiledWidget, rowIndexes: number[]): DotPath | undefined {
  if (widget.path === undefined) {
    return undefined;
  }
  if ('error' in widget.path) {
    throw widget.path.error;
  }
  return pathInRow(widget.path.parts, rowIndexes);
}

/** The widget of a row layout as one row has it: with the uid and the path of that row. */
function sourceInRow(
  source: FormWidget<string>,
  uid: Uid,
  path: DotPath | undefined,
): FormWidget<string> {
  // Only an input has a path, so both conditions are true for the same widgets. The types
  // need both.
  if (isInputWidget(source) && path !== undefined) {
    return { ...source, uid, path };
  }
  return { ...source, uid };
}

/**
 * Builds the row layouts of a repeater: one for each entry of the array at its path. A value
 * that is no array gives no row.
 *
 * @param instance - The instance of the repeater, with the rows of the build before.
 * @param older - The instance of the repeater in the older tree.
 */
function buildRows(
  widget: CompiledWidget,
  data: Record<string, any>,
  instance: WidgetInstance,
  older: WidgetInstance | undefined,
): WidgetInstance[] {
  if (widget.repeater === undefined || instance.path === undefined) {
    return NO_INSTANCES;
  }
  const rowValues: unknown = get(data, instance.path);
  if (!Array.isArray(rowValues)) {
    return NO_INSTANCES;
  }
  const rowLayout = widget.repeater.rowLayout;
  const repeaterPath = instance.path;
  const previousRowAt = readerOfRows(instance.rows);
  const olderRowAt = readerOfRows(
    older === undefined || older === instance ? NO_INSTANCES : older.rows,
  );

  const rows: WidgetInstance[] = [];
  // `forEach` skips an empty place of the array, so such a place gets no row.
  rowValues.forEach((_rowValue, rowIndex) => {
    const previousRow = previousRowAt(rowIndex);
    const olderRow = olderRowAt(rowIndex);
    const knownRow = previousRow ?? olderRow;
    rows.push(
      knownRow === undefined
        ? buildInstance(
            rowLayout,
            data,
            [...instance.rowIndexes, rowIndex],
            `${repeaterPath}.${rowIndex}`,
            undefined,
            undefined,
          )
        : buildInstance(
            rowLayout,
            data,
            knownRow.rowIndexes,
            knownRow.itemPath,
            previousRow,
            olderRow,
          ),
    );
  });
  return rows;
}

/**
 * @param rows - The rows of a repeater. They are in the order of their indexes.
 * @returns A function that gives the row with a given index, or `undefined`. The indexes must
 *   be asked for in rising order, because the function only moves forward in the list.
 */
function readerOfRows(rows: WidgetInstance[]): (rowIndex: number) => WidgetInstance | undefined {
  let position = 0;
  return (rowIndex) => {
    while (position < rows.length && innermostRowIndex(rows[position]) < rowIndex) {
      position += 1;
    }
    const candidate: WidgetInstance | undefined = rows[position];
    return candidate !== undefined && innermostRowIndex(candidate) === rowIndex
      ? candidate
      : undefined;
  };
}
