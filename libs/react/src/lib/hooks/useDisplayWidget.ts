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
    templateData,
  };
}
