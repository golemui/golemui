import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useExtraProps } from './internal/useExtraProps';

export function useControl<T, ExtraProps extends Record<string, any>>(
  field: Core.ControlField<T, string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [value, setValue] = useState<T | undefined>(undefined);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(undefined);
  const [isRequired, setIsRequired] = useState<boolean | undefined>(undefined);
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

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.dataByPath$<T>(field.path))
      .subscribe((data) => setValue(data));
    return () => sub.unsubscribe();
  }, [field.path, formContext.store.state$]);

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        setIsDisabled(fieldFlags?.disabled ?? (field.disabled as boolean));
        setIsRequired(fieldFlags?.required ?? (field.required as boolean));
        setIsReadonly(fieldFlags?.readonly ?? (field.readonly as boolean));
      });
    return () => sub.unsubscribe();
  }, [field, formContext.store]);

  useEffect(() => {
    const sub = formContext.store.state$.pipe(Core.currentStates).subscribe(() => {
      setLabel(formContext.getPropertyValueByCurrentState('label', field) ?? calculateLabel(field));
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

  return {
    uid,
    label,
    value,
    formContext, // for the repeater
    props,
    isDisabled,
    isRequired,
    isReadonly,
    onValueChanged,
  };
}

function calculateLabel<T>(field: Core.ControlField<T, string>) {
  return field.label === undefined
    ? Core.toLabel(field.path)
    : field.label === ''
      ? undefined
      : field.label;
}
