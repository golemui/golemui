import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useInteractiveField<ExtraProps extends Record<string, any>>(
  field: Core.InteractiveField<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(undefined);
  const templateData = useTemplateData<Core.InteractiveField<string>, ExtraProps>(field);

  useEffect(() => {
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
    formContext.emitEvent('click', field);
  }, [field, formContext]);

  return {
    uid,
    templateData,
    isDisabled,
    onClick,
  };
}
