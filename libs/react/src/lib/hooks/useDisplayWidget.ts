import { type DisplayWidget } from '@golemui/core';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';
import { useViewModelAccumulator, useWidgetViewModel } from './internal/use-widget-view-model';

export function useDisplayWidget<ExtraProps extends Record<string, any>>(
  widget: DisplayWidget<string>,
) {
  const { formContext } = useReactFormContext();

  const viewModel = useWidgetViewModel(formContext.store, widget.uid);
  const templateData = useViewModelAccumulator<
    WithFlattenedProps<DisplayWidget<string>, ExtraProps>
  >(viewModel, (previous, currentViewModel) =>
    mergeViewModelIntoTemplateData(
      previous ?? ({} as WithFlattenedProps<DisplayWidget<string>, ExtraProps>),
      currentViewModel,
      formContext.dependencies,
    ),
  );

  return {
    uid: widget.uid,
    /**
     * The form's `formName`. Every DOM id the widget renders starts with it, so two forms on one
     * page never share an id: pass it as `idPrefix` to GolemUI Components.
     */
    formName: formContext.formName,
    templateData,
  };
}
