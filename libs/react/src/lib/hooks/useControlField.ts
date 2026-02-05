import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { combineLatest } from 'rxjs';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useControlField<T, ExtraProps extends Record<string, any>>(
  field: Core.InputWidget<T, string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [value, setValue] = useState<T | undefined>(undefined);
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState<boolean | undefined>(undefined);

  const templateData = useTemplateData<Core.InputWidget<T, string>, ExtraProps>(field);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: field },
    });
    formContext.store.dispatch({
      type: 'SET_WIDGET_INITIAL_DATA',
      payload: { data: field.defaultValue, path: field.path },
    });
    setUid(field.uid);
  }, [field, formContext.store]);

  // Set the initial templateData, including the controls's data value
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.dataByPath$<T>(field.path))
      .subscribe((data) => setValue(data));
    return () => sub.unsubscribe();
  }, [field.path, formContext.store.state$]);

  // Listen to the validation stream for this control
  useEffect(() => {
    const validation$ = formContext.store.state$.pipe(Core.validationByPath$(field.path));
    const injectedValidation$ = formContext.store.state$.pipe(
      Core.injectedValidationByPath$(field.path),
    );

    const sub = combineLatest([validation$, injectedValidation$]).subscribe(
      ([validation, injectedValidation]) => {
        setErrors([...(validation ?? []), ...(injectedValidation ?? [])]);
      },
    );
    return () => sub.unsubscribe();
  }, [field, formContext.store]);

  // Listen to the touchedControls stream for this control
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.touchedControlsByPath$(field.path))
      .subscribe((touched) => {
        setIsTouched(touched);
      });
    return () => sub.unsubscribe();
  }, [field, formContext.store]);

  useEffect(() => {
    formContext.emitEvent('load', field);
  }, [formContext, field]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: field.uid },
      });
    };
  }, [formContext, field]);

  const onValueChanged = useCallback(
    (newValue: T) => {
      formContext.store.dispatch({
        type: 'SET_WIDGET_DATA',
        payload: { path: field.path, data: newValue },
      });
      formContext.emitEvent('change', field);
    },
    [field, formContext],
  );

  const onFilter = useCallback(
    (newValue: T) => {
      formContext.emitEvent('filter', field, newValue);
    },
    [field, formContext],
  );

  const injectValidationIssues = useCallback(
    (issues: string[] | null) => {
      formContext.store.dispatch({
        type: 'INJECT_VALIDATION_ISSUES',
        payload: { path: field.path, issues },
      });
    },
    [field, formContext],
  );

  const onBlur = useCallback(() => {
    formContext.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: field.path, uid: field.uid },
    });
  }, [formContext, field]);

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
