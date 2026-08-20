import {
  type NonFunctionWidget,
  type WidgetViewModel,
  assertNoPropCollisions,
} from '@golemui/core';
import { type Ref } from 'vue';

export type WithFlattenedProps<
  F extends NonFunctionWidget<string>,
  ExtraProps extends NonFunctionWidget<string>['props'],
> = F & ExtraProps & { lang: string; deps: Record<string, unknown> };

/**
 * Writes one view-model emission into a templateData ref: the calculated widget flattened with
 * its props (props win), plus the extra fields the caller reads from the view model.
 *
 * A hidden widget has no calculated widget, so that part is skipped and the last visible values
 * stay. Extra fields are always merged.
 *
 * @param templateData - The ref handed to the component.
 * @param viewModel - The emission to merge.
 * @param deps - Form context dependencies, read in templates as `deps`.
 * @param extraFields - Per-kind fields, such as `value` and `errors` for an input.
 */
export function mergeViewModelIntoTemplateData<TemplateData extends Record<string, any>>(
  templateData: Ref<TemplateData>,
  viewModel: WidgetViewModel,
  deps: Record<string, unknown>,
  extraFields?: (viewModel: WidgetViewModel) => Record<string, unknown>,
): void {
  const next: Record<string, any> = { ...templateData.value };
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
  templateData.value = next as TemplateData;
}
