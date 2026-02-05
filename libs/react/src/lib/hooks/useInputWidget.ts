import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { combineLatest } from 'rxjs';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useInputWidget<T, ExtraProps extends Record<string, any>>(
  widget: Core.InputWidget<T, string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [value, setValue] = useState<T | undefined>(undefined);
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState<boolean | undefined>(undefined);

  const templateData = useTemplateData<Core.InputWidget<T, string>, ExtraProps>(widget);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: widget },
    });
    formContext.store.dispatch({
      type: 'SET_WIDGET_INITIAL_DATA',
      payload: { data: widget.defaultValue, path: widget.path },
    });
    setUid(widget.uid);
  }, [widget, formContext.store]);

  // Set the initial templateData, including the controls's data value
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.dataByPath$<T>(widget.path))
      .subscribe((data) => setValue(data));
    return () => sub.unsubscribe();
  }, [widget.path, formContext.store.state$]);

  // Listen to the validation stream for this control
  useEffect(() => {
    const validation$ = formContext.store.state$.pipe(Core.validationByPath$(widget.path));
    const injectedValidation$ = formContext.store.state$.pipe(
      Core.injectedValidationByPath$(widget.path),
    );

    const sub = combineLatest([validation$, injectedValidation$]).subscribe(
      ([validation, injectedValidation]) => {
        setErrors([...(validation ?? []), ...(injectedValidation ?? [])]);
      },
    );
    return () => sub.unsubscribe();
  }, [widget, formContext.store]);

  // Listen to the touchedControls stream for this control
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.touchedControlsByPath$(widget.path))
      .subscribe((touched) => {
        setIsTouched(touched);
      });
    return () => sub.unsubscribe();
  }, [widget, formContext.store]);

  useEffect(() => {
    formContext.emitEvent('load', widget);
  }, [formContext, widget]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: widget.uid },
      });
    };
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
  }, [formContext, widget]);

  return {
    uid,
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
