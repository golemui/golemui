import {
  type NonFunctionWidget,
  type WidgetViewModel,
  assertNoPropCollisions,
} from '@golemui/core';

export type WithFlattenedProps<
  F extends NonFunctionWidget<string>,
  ExtraProps extends NonFunctionWidget<string>['props'],
> = F & ExtraProps & { lang: string; deps: Record<string, unknown> };

/**
 * Merges one view-model emission into the current templateData: the calculated widget flattened
 * with its props (props win), plus the extra fields the calling hook reads from the view model.
 * Pure, so the hooks can call it inside a setState updater.
 *
 * A hidden widget has no calculated widget, so that part is skipped and the last visible values stay.
 * Extra fields are always merged.
 *
 * @param current - The templateData the hook holds right now.
 * @param viewModel - The emission to merge.
 * @param deps - Form context dependencies, read in components as `deps`.
 * @param extraFields - Per-kind fields, such as `value` and `errors` for an input.
 * @returns A new templateData object.
 */
export function mergeViewModelIntoTemplateData<TemplateData extends Record<string, any>>(
  current: TemplateData,
  viewModel: WidgetViewModel,
  deps: Record<string, unknown>,
  extraFields?: (viewModel: WidgetViewModel) => Record<string, unknown>,
): TemplateData {
  const next: Record<string, any> = { ...current };
  const calculatedWidget = viewModel.widget;
  if (calculatedWidget !== undefined) {
    const obj = {
      ...calculatedWidget,
      lang: viewModel.lang,
      deps,
    };
    assertNoPropCollisions(calculatedWidget.uid, calculatedWidget.props, obj);
    Object.assign(next, obj, calculatedWidget.props);
  }
  if (extraFields) {
    Object.assign(next, extraFields(viewModel));
  }
  return next as TemplateData;
}
