import { type FormWidget } from '../form-widget';
import { type DotPath, type Uid } from '../shared';
import { type DerivedWidget } from '../store/model';

/**
 * What the conditions of a widget give. A flag has a key only when the widget has that
 * condition, so a widget with only `disabled: { when }` has `{ disabled: true }` or
 * `{ disabled: false }`. A widget below a hidden widget has `{ hidden: true }` and no other key.
 */
export type WidgetFlags = { hidden?: boolean; disabled?: boolean; readonly?: boolean };

/**
 * One widget that exists for the current form data. A widget outside a repeater has one
 * instance. A widget of a repeater row has one instance for each row.
 *
 * An instance is never changed after it is built. A derive gives a new instance only to a
 * repeater whose rows changed and to a widget whose flags or computed widget changed, together
 * with the widgets above them. Every other instance stays the same object.
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
  /**
   * The flags of the last derive that succeeded. `undefined` for a widget with no condition
   * that is not below a hidden widget, and for an instance that no derive has computed yet.
   */
  flags: WidgetFlags | undefined;
  /**
   * The computed widget of the last derive or language change that succeeded: every field and
   * prop has its value for the active states, each text with `{{ }}` is evaluated, and each
   * translation config is translated. `undefined` while the widget is hidden, and for an
   * instance that no derive has computed yet.
   */
  calculated: DerivedWidget<FormWidget<string>> | undefined;
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
 * @param first - A list of instances.
 * @param second - Another list of instances.
 * @returns True when the two lists hold the same instances, in the same order.
 */
export function hasSameInstances(first: WidgetInstance[], second: WidgetInstance[]): boolean {
  return (
    first.length === second.length &&
    second.every((instance, position) => instance === first[position])
  );
}

/**
 * Gives the previous list when a new list holds the same instances. So an instance whose
 * children or rows did not change keeps the same array.
 *
 * @param previous - The previous list.
 * @param built - The new list.
 * @returns `previous` when it holds exactly the instances of `built`, in the same order.
 *   Otherwise `built`.
 */
export function previousIfSameInstances(
  previous: WidgetInstance[],
  built: WidgetInstance[],
): WidgetInstance[] {
  return hasSameInstances(previous, built) ? previous : built;
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
