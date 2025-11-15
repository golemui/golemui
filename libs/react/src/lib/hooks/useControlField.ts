import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useExtraProps } from './internal/useExtraProps';

export function useControlField<T, ExtraProps extends Record<string, any>>(
  field: Core.ControlField<T, string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [value, setValue] = useState<T | undefined>(undefined);
  const [validator, setValidator] = useState<Core.Validator | undefined>(undefined);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(undefined);
  const [isReadonly, setIsReadonly] = useState<boolean | undefined>(undefined);
  const props = useExtraProps<ExtraProps>(field);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });
    formContext.store.dispatch({
      type: 'SET_FIELD_DATA',
      updateIf: (oldValue) => oldValue === undefined,
      payload: { data: field.defaultValue, path: field.path },
    });
    setLabel(calculateLabel(field));
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
        setErrors(validation?.status?.errors || []);
      });
    return () => sub.unsubscribe();
  }, [field, formContext.store]);

  // Listen to the fieldFlags stream (`disabled` and `readonly` flags)
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        setIsDisabled(fieldFlags?.disabled ?? (field.disabled as boolean));
        setIsReadonly(fieldFlags?.readonly ?? (field.readonly as boolean));
      });
    return () => sub.unsubscribe();
  }, [field, formContext.store]);

  // Listen to the form states stream and keep the `label` property in sync with the current state
  useEffect(() => {
    const sub = formContext.store.state$.pipe(Core.currentStates).subscribe(() => {
      setLabel(formContext.getPropertyValueByCurrentState('label', field) ?? calculateLabel(field));
    });
    return () => sub.unsubscribe();
  }, [field, formContext]);

  // Listen to the form states stream and keep the `validator` property in sync with the current state
  useEffect(() => {
    const sub = formContext.store.state$.pipe(Core.currentStates).subscribe(() => {
      setValidator(formContext.getPropertyValueByCurrentState('validator', field));
    });
    return () => sub.unsubscribe();
  }, [field, formContext]);

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
        updateIf: () => true,
        payload: { path: field.path, data: newValue },
      });
      formContext.emitEvent('change', field);
    },
    [field, formContext],
  );

  const onBlur = useCallback(() => {
    formContext.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur' },
    });
  }, [formContext]);

  return {
    uid,
    label,
    value,
    formContext, // for the repeater
    props,
    validator,
    errors,
    isDisabled,
    isReadonly,
    onValueChanged,
    onBlur,
  };
}

function calculateLabel<T>(field: Core.ControlField<T, string>) {
  return field.label === undefined
    ? Core.toLabel(field.path)
    : field.label === ''
      ? undefined
      : field.label;
}
