import { type InputWidget, type NonFunctionWidget, widgetViewModel$ } from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './internal/template-data';

export function useInputWidget<T, ExtraProps extends Record<string, any>>(
  widget: InputWidget<T, string>,
) {
  const { formContext } = useReactFormContext();
  const [value, setValue] = useState<T | undefined>(undefined);
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState<boolean | undefined>(undefined);
  const [templateData, setTemplateData] = useState(
    {} as WithFlattenedProps<InputWidget<T, string>, ExtraProps> & {
      /**
       * Repeater inputs only: one row layout node per row of the array value, uid and path already indexed
       */
      rows?: NonFunctionWidget<string>[];
    },
  );

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(widgetViewModel$<T>(widget.uid))
      .subscribe((viewModel) => {
        setValue(viewModel.value);
        // `errors` is shared between widgets while the form is untouched, so never write into it.
        setErrors(viewModel.errors);
        setIsTouched(viewModel.touched);
        setTemplateData((current) =>
          mergeViewModelIntoTemplateData(current, viewModel, formContext.dependencies, (vm) =>
            // Keep the last rows while hidden, the view model empties them.
            vm.widget !== undefined ? { rows: vm.rows } : {},
          ),
        );
      });
    return () => sub.unsubscribe();
  }, [widget, formContext]);

  useEffect(() => {
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
