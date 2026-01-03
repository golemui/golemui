import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData, WithFlattenedProps } from './internal/useExtraProps';

export function useControlField<T, ExtraProps extends Record<string, any>>(
  field: Core.ControlField<T, string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [value, setValue] = useState<T | undefined>(undefined);
  const [errors, setErrors] = useState<string[]>([]);
  const [isTouched, setIsTouched] = useState<boolean | undefined>(undefined);

  const calculateLabel = useCallback(
    (obj: WithFlattenedProps<Core.ControlField<T, string>, ExtraProps>) => {
      const label =
        obj.label === undefined
          ? Core.toLabel(obj['path'])
          : obj.label === ''
            ? undefined
            : obj.label;
      obj.label = label;
      return obj;
    },
    [],
  );

  const templateData = useTemplateData<Core.ControlField<T, string>, ExtraProps>(
    field,
    calculateLabel,
  );

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });
    formContext.store.dispatch({
      type: 'SET_FIELD_INITIAL_DATA',
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
    const sub = formContext.store.state$
      .pipe(Core.validationByPath$(field.path))
      .subscribe((validation) => {
        setErrors([
          ...(validation?.status?.issues ?? []),
          ...(validation?.status?.injectedIssues ?? []),
        ]);
      });
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
        type: 'REMOVE_FIELD',
        payload: { uid: field.uid },
      });
    };
  }, [formContext, field]);

  const onValueChanged = useCallback(
    (newValue: T) => {
      formContext.store.dispatch({
        type: 'SET_FIELD_DATA',
        payload: { path: field.path, data: newValue },
      });
      formContext.emitEvent('change', field);
    },
    [field, formContext],
  );

  const onBlur = useCallback(() => {
    formContext.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: field.path },
    });
  }, [formContext, field]);

  return {
    uid,
    value,
    templateData,
    errors,
    isTouched,
    onValueChanged,
    onBlur,
  };
}
