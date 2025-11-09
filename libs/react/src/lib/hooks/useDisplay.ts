import * as Core from '@formforge/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useExtraProps } from './internal/useExtraProps';

export function useDisplay<ExtraProps extends Record<string, any>>(field: Core.DisplayField) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const props = useExtraProps<ExtraProps>(field);

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
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_FIELD',
        payload: { uid: field.uid },
      });
    };
  }, [formContext, field]);
  return {
    uid,
    props,
  };
}
