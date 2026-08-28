import { type InputWidget, type NonFunctionWidget } from '@golemui/core';
import { useCallback, useEffect, useRef } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';
import { useViewModelAccumulator, useWidgetViewModel } from './internal/use-widget-view-model';

type InputTemplateData<T, ExtraProps extends Record<string, any>> = WithFlattenedProps<
  InputWidget<T, string>,
  ExtraProps
> & {
  /**
   * Repeater inputs only: one row layout node per row of the array value, uid and path already indexed
   */
  rows?: NonFunctionWidget<string>[];
};

export function useInputWidget<T, ExtraProps extends Record<string, any>>(
  widget: InputWidget<T, string>,
) {
  const { formContext } = useReactFormContext();

  const viewModel = useWidgetViewModel<T>(formContext.store, widget.uid);
  const templateData = useViewModelAccumulator<InputTemplateData<T, ExtraProps>>(
    viewModel,
    (previous, currentViewModel) =>
      mergeViewModelIntoTemplateData(
        previous ?? ({} as InputTemplateData<T, ExtraProps>),
        currentViewModel,
        formContext.dependencies,
        (vm) =>
          // Keep the last rows while hidden, the view model empties them.
          vm.widget !== undefined ? { rows: vm.rows } : {},
      ),
  );

  // `errors` is shared between widgets while the form is untouched, so never write into it.
  const { value, errors, touched: isTouched } = viewModel;

  // A repeater row widget arrives as a new object whenever the row set changes, so emit
  // `load` once per uid and store, not once per widget object identity.
  const lastLoad = useRef<{ store: unknown; uid: string } | undefined>(undefined);
  useEffect(() => {
    if (lastLoad.current?.store === formContext.store && lastLoad.current?.uid === widget.uid) {
      return;
    }
    lastLoad.current = { store: formContext.store, uid: widget.uid };
    formContext.emitEvent('load', widget);
  }, [formContext, widget]);

  const onValueChanged = useCallback(
    (newValue: T) => {
      formContext.store.dispatch({
        type: 'SET_WIDGET_DATA',
        payload: { path: widget.path, data: newValue },
      });
      formContext.emitEvent('change', widget);
    },
    [widget, formContext],
  );

  const onFilter = useCallback(
    (newValue: T) => {
      formContext.emitEvent('filter', widget, newValue);
    },
    [widget, formContext],
  );

  const injectValidationIssues = useCallback(
    (issues: string[] | null) => {
      formContext.store.dispatch({
        type: 'INJECT_VALIDATION_ISSUES',
        payload: { path: widget.path, issues },
      });
    },
    [widget, formContext],
  );

  const onBlur = useCallback(() => {
    formContext.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: widget.path, uid: widget.uid },
    });
    formContext.emitEvent('blur', widget);
  }, [formContext, widget]);

  return {
    uid: widget.uid,
    value,
    templateData,
    errors,
    isTouched,
    onValueChanged,
    onFilter,
    onBlur,
    injectValidationIssues,
  };
}
