import {
  type FormWidget,
  type InputWidget,
  isFunctionWidget,
  type LayoutWidget,
  type NonFunctionWidget,
} from '../../form-widget';
import { flattenForm } from '../../utils/form';
import { get } from '../../utils/object';
import {
  makeRepeaterItemConfig,
  toRepeaterItemUid,
  transformWidgetWhenExpressions,
} from '../../utils/repeater';
import { type State } from '../model';

/**
 * Walks every repeater's live array data and derives, per item, the same concrete widgets the renderer mounts for that item.
 * Produces two maps keyed by materialized uid, both rebuilt from scratch on every run:
 * - `repeaterItemScopes`: which item owns each widget (binds `$item` / `$index`).
 * - `materializedRepeaterWidgets`: the item-concrete widget configs, with uid and path baked, `when` expressions rewritten for the item's row, and function widgets resolved.
 *
 * `calculateWidgetFlags` and `calculateWidgetProps` consume these maps, so this stage must run before them in the pipeline.
 */
// TODO: this is Golem specific. We should either move this to a middleware or make the repeater contract part of the core
export const materializeRepeaterItems = (state: State): State => {
  const scopes: State['repeaterItemScopes'] = {};
  const widgets: State['materializedRepeaterWidgets'] = {};

  const repeaters = Object.values(state.flatForm).filter(
    (w): w is RepeaterContract => !isFunctionWidget(w) && w.type === 'repeater',
  );
  for (const repeater of repeaters) {
    expandRepeaterItems(state, repeater, [], scopes, widgets);
  }

  return { ...state, repeaterItemScopes: scopes, materializedRepeaterWidgets: widgets };
};

type RepeaterContract = InputWidget<string> & {
  type: 'repeater';
  props: {
    template: LayoutWidget<string>;
  };
};

function expandRepeaterItems(
  state: State,
  repeaterWidget: RepeaterContract,
  outerIndexes: number[],
  scopes: State['repeaterItemScopes'],
  widgets: State['materializedRepeaterWidgets'],
): void {
  const template = repeaterWidget.props.template;
  const arrayData = get(state.data, (repeaterWidget as any).path as string);
  if (!Array.isArray(arrayData)) {
    return;
  }

  arrayData.forEach((item, i) => {
    const currentIndexes = [...outerIndexes, i];
    // For nested recursion the repeater widget is already materialized, so its path is concrete.
    const itemScope = { itemPath: `${(repeaterWidget as any).path}.${i}`, index: i };

    flattenForm([template as FormWidget<never>]).forEach((widget) => {
      let resolved: NonFunctionWidget<string>;
      // TODO: repeater items are not decoded, so they dont have uid, type or kind!!!
      if (isFunctionWidget(widget)) {
        resolved = widget({
          $form: state.data,
          $item: item,
          $index: i,
          errors: undefined,
          touched: undefined,
          translate: undefined,
        });
        resolved.uid = widget.uid as string;
      } else {
        resolved = widget as NonFunctionWidget<string>;
      }

      if (resolved.type === 'repeater') {
        const indexedNestedRepeater = makeRepeaterItemConfig(
          resolved,
          currentIndexes,
        ) as RepeaterContract;
        // The nested repeater widget itself belongs to the outer item; its template children get innermost entries from the recursion below.
        // The container is not added to the widget map, so its own `when` flags are never evaluated (same as before this stage existed).
        scopes[toRepeaterItemUid(resolved.uid, currentIndexes)] = itemScope;
        expandRepeaterItems(state, indexedNestedRepeater, currentIndexes, scopes, widgets);
        return;
      }

      const materialized = transformWidgetWhenExpressions(
        makeRepeaterItemConfig(resolved, currentIndexes),
        currentIndexes,
      );
      scopes[materialized.uid] = itemScope;
      widgets[materialized.uid] = materialized;
    });
  });
}
