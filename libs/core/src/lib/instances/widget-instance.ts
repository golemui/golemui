import { type FormWidget } from '../form-widget';
import { type DotPath, type Uid } from '../shared';

/**
 * One widget that exists for the current form data. A widget outside a repeater has one
 * instance. A widget of a repeater row has one instance for each row.
 *
 * An instance is never changed after it is built. When the data changes, only a repeater whose
 * rows changed gets a new instance, together with the widgets above it. Every other instance
 * stays the same object.
 */
export type WidgetInstance = {
  /** The uid of the widget, with the index of each row around it, for example `name[2][1]`. */
  uid: Uid;
  /**
   * The widget of the form definition. Outside a repeater it is the decoded widget, the same
   * object. In a row it is a copy with the uid and the path of that row, made one time.
   */
  source: FormWidget<string>;
  /** The data path of an input, for example `teams.2.devs.1.name`. `undefined` for other kinds. */
  path: DotPath | undefined;
  /** The index of each row around the widget, the outermost first. Empty outside a repeater. */
  rowIndexes: number[];
  /** The data path of the innermost row around the widget, for example `teams.2.devs.1`. */
  itemPath: DotPath | undefined;
  /** The children of a layout, in the order of the definition. Empty for the other kinds. */
  children: WidgetInstance[];
  /**
   * The row layouts of a repeater, in the order of its array. Empty for every other widget. An
   * empty place of the array has no row. So the index of a row is the last entry of its
   * `rowIndexes`, and it can differ from the position of the row in this list.
   */
  rows: WidgetInstance[];
};

/** The widget instances of a form, as a tree below the root layout. */
export type WidgetInstanceTree = {
  /** The instance of the root layout. `undefined` when the form has no usable definition. */
  root: WidgetInstance | undefined;
};

/**
 * @returns The tree of a store that has no definition, or whose definition has an error. It has
 *   no instance.
 */
export function emptyWidgetInstanceTree(): WidgetInstanceTree {
  return { root: undefined };
}

/**
 * @param instance - An instance inside a repeater row.
 * @returns The index of the innermost row around the instance, in the array of its repeater.
 */
export function innermostRowIndex(instance: WidgetInstance): number {
  return instance.rowIndexes[instance.rowIndexes.length - 1];
}

/**
 * Calls a function for every instance below and including one instance, in the order of the
 * document: a widget, then each of its children with everything below it, then each of its rows
 * with everything below it.
 *
 * @param instance - The first instance. `undefined` calls nothing.
 * @param visit - The function to call with each instance.
 *
 * @example
 * ```ts
 * const uids: string[] = [];
 * forEachInstance(tree.root, (instance) => uids.push(instance.uid));
 * // ['#0', 'users', 'row[0]', 'name[0]', 'row[1]', 'name[1]', 'save']
 * ```
 */
export function forEachInstance(
  instance: WidgetInstance | undefined,
  visit: (instance: WidgetInstance) => void,
): void {
  if (instance === undefined) {
    return;
  }
  visit(instance);
  for (const child of instance.children) {
    forEachInstance(child, visit);
  }
  for (const row of instance.rows) {
    forEachInstance(row, visit);
  }
}
