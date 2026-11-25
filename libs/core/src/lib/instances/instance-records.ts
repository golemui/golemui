import { type CompiledWidget } from '../compile/compiled-form';
import { type DotPath } from '../shared';
import { type RepeaterItemScope, type RepeaterRow, type State } from '../store/model';
import {
  forEachInstance,
  innermostRowIndex,
  type WidgetInstance,
  type WidgetInstanceTree,
} from './widget-instance';

/** The records of the state that list every widget, the rows around it and its flags, by uid. */
export type InstanceRecords = Pick<
  State,
  'resolvedSources' | 'repeaterItemScopes' | 'repeaterRows' | 'widgetFlags'
>;

/**
 * Writes the widget instances of a form as the four records that the rest of the store reads.
 * The keys are written in the order of the document.
 *
 * @param tree - The widget instances.
 * @param compiledRoot - The compiled root layout that the tree was built from.
 * @returns New records. A widget outside a repeater has no entry in the two repeater records,
 *   and a widget without flags has no entry in `widgetFlags`.
 *
 * @example
 * ```ts
 * const { resolvedSources, repeaterItemScopes } = recordsOfInstances(tree, compiled.root);
 * // resolvedSources['name[1]'].path is 'users.1.name'
 * // repeaterItemScopes['name[1]'] is { itemPath: 'users.1', index: 1 }
 * ```
 */
export function recordsOfInstances(
  tree: WidgetInstanceTree,
  compiledRoot: CompiledWidget | undefined,
): InstanceRecords {
  const records: InstanceRecords = {
    resolvedSources: {},
    repeaterItemScopes: {},
    repeaterRows: {},
    widgetFlags: {},
  };
  if (tree.root !== undefined && compiledRoot !== undefined) {
    addInstance(records, tree.root, compiledRoot, [], undefined);
  }
  return records;
}

/**
 * Writes the flags of the widget instances as the record `widgetFlags`.
 *
 * @param tree - The widget instances, after their flags were computed.
 * @returns A new record. A widget without flags has no entry.
 *
 * @example
 * ```ts
 * const widgetFlags = flagsRecordOfInstances(tree);
 * // widgetFlags['vat'] is { hidden: true }, and a widget with no condition has no key
 * ```
 */
export function flagsRecordOfInstances(tree: WidgetInstanceTree): State['widgetFlags'] {
  const widgetFlags: State['widgetFlags'] = {};
  forEachInstance(tree.root, (instance) => {
    writeFlags(widgetFlags, instance);
  });
  return widgetFlags;
}

/**
 * Writes the computed widgets of the instances as the record `calculatedWidgets`.
 *
 * @param tree - The widget instances, after their widgets were computed.
 * @returns A new record. Its keys are in the order of the document, except a uid that is a whole
 *   number, which an object always puts first. A widget that is not computed, for example a
 *   hidden one, has no entry.
 *
 * @example
 * ```ts
 * const calculatedWidgets = calculatedRecordOfInstances(tree);
 * // calculatedWidgets['name[1]'].current.label is the label of the input in the second row
 * ```
 */
export function calculatedRecordOfInstances(tree: WidgetInstanceTree): State['calculatedWidgets'] {
  const calculatedWidgets: State['calculatedWidgets'] = {};
  forEachInstance(tree.root, (instance) => {
    if (instance.calculated === undefined) {
      // Two widgets can have one uid. As in `writeFlags`, the entry is the one of the last widget.
      delete calculatedWidgets[instance.uid];
    } else {
      calculatedWidgets[instance.uid] = instance.calculated;
    }
  });
  return calculatedWidgets;
}

function writeFlags(widgetFlags: State['widgetFlags'], instance: WidgetInstance): void {
  if (instance.flags === undefined) {
    // Two widgets can have one uid. The entry is then the one of the last widget, as in the
    // other records, so the flags of the widget before must not stay.
    delete widgetFlags[instance.uid];
  } else {
    widgetFlags[instance.uid] = instance.flags;
  }
}

/**
 * @param rowsAround - The rows around the instance, the outermost first. All the widgets of one
 *   row share this array.
 * @param itemScope - The innermost row around the instance. `undefined` outside a repeater.
 */
function addInstance(
  records: InstanceRecords,
  instance: WidgetInstance,
  widget: CompiledWidget,
  rowsAround: RepeaterRow[],
  itemScope: RepeaterItemScope | undefined,
): void {
  records.resolvedSources[instance.uid] = instance.source;
  writeFlags(records.widgetFlags, instance);
  if (itemScope !== undefined) {
    records.repeaterItemScopes[instance.uid] = itemScope;
    records.repeaterRows[instance.uid] = rowsAround;
  }

  instance.children.forEach((child, position) => {
    addInstance(records, child, widget.children[position], rowsAround, itemScope);
  });

  const repeater = widget.repeater;
  if (repeater === undefined) {
    return;
  }
  for (const rowLayout of instance.rows) {
    // A row layout always has the path and the index of its row.
    const itemPath = rowLayout.itemPath as DotPath;
    const index = innermostRowIndex(rowLayout);
    const row: RepeaterRow = { declaredItemPath: repeater.declaredItemPath, itemPath, index };
    addInstance(records, rowLayout, repeater.rowLayout, [...rowsAround, row], { itemPath, index });
  }
}
