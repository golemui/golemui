import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useExtraProps } from './internal/useExtraProps';

export function useInteractive<ExtraProps extends Record<string, any>>(
  field: Core.InteractiveField,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [label, setLabel] = useState<string | undefined>(undefined);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(undefined);
  const props = useExtraProps<ExtraProps>(field);

  useEffect(() => {
    setLabel(field.label);
    setUid(field.uid);
  }, [field]);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });
  }, [field, formContext.store]);

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.fieldFlagsByUid$(field.uid))
      .subscribe((fieldFlags) => {
        setIsDisabled(fieldFlags?.disabled ?? (field.disabled as boolean));
      });
    return () => sub.unsubscribe();
  }, [field, formContext.store]);

  useEffect(() => {
    const sub = formContext.store.state$.pipe(Core.currentStates).subscribe(() => {
      setLabel(formContext.getPropertyValueByCurrentState('label', field));
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

  const onClick = useCallback(() => {
    formContext.store.dispatch({ type: 'TOUCHED' });
    formContext.emitEvent('click', field);
  }, [field, formContext]);

  return {
    uid,
    label,
    props,
    isDisabled,
    onClick,
  };
}
