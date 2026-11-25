import { type CompiledWidget } from '../compile/compiled-form';
import { type DotPath } from '../shared';
import { type RepeaterItemScope, type RepeaterRow, type State } from '../store/model';
import { innermostRowIndex, type WidgetInstance, type WidgetInstanceTree } from './widget-instance';

/** The records of the state that list every widget, and the rows around it, by uid. */
export type InstanceRecords = Pick<
  State,
  'resolvedSources' | 'repeaterItemScopes' | 'repeaterRows'
>;

/**
 * Writes the widget instances of a form as the three records that the rest of the store reads.
 * The keys are written in the order of the document.
 *
 * @param tree - The widget instances.
 * @param compiledRoot - The compiled root layout that the tree was built from.
 * @returns New records. A widget outside a repeater has an entry only in `resolvedSources`.
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
  };
  if (tree.root !== undefined && compiledRoot !== undefined) {
    addInstance(records, tree.root, compiledRoot, [], undefined);
  }
  return records;
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
