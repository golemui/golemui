import { type FormWidget, type LayoutWidget } from '@golemui/core';
import { useCallback } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';
import { useViewModelAccumulator, useWidgetViewModel } from './internal/use-widget-view-model';

type LayoutRenderData<ExtraProps extends Record<string, any>> = {
  templateData: WithFlattenedProps<LayoutWidget<string>, ExtraProps>;
  children: FormWidget<string>[];
};

export function useLayoutWidget<ExtraProps extends Record<string, any>>(
  widget: LayoutWidget<string>,
) {
  const { formContext } = useReactFormContext();

  const viewModel = useWidgetViewModel(formContext.store, widget.uid);
  const { templateData, children } = useViewModelAccumulator<LayoutRenderData<ExtraProps>>(
    viewModel,
    (previous, currentViewModel) => ({
      templateData: mergeViewModelIntoTemplateData(
        previous?.templateData ?? ({} as WithFlattenedProps<LayoutWidget<string>, ExtraProps>),
        currentViewModel,
        formContext.dependencies,
      ),
      // Keep the last children while hidden, otherwise the layout renders empty
      children:
        currentViewModel.widget !== undefined
          ? currentViewModel.children
          : (previous?.children ?? []),
    }),
  );

  const onChange = useCallback(
    (detail: any) => {
      formContext.emitEvent('change', widget, detail);
    },
    [widget, formContext],
  );

  return {
    uid: widget.uid,
    /**
     * The form's `formName`. Every DOM id the widget renders starts with it, so two forms on one
     * page never share an id: pass it as `idPrefix` to GolemUI Components.
     */
    formName: formContext.formName,
    children,
    templateData,
    onChange,
  };
}
