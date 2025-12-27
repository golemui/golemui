import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useDisplayField<ExtraProps extends Record<string, any>>(
  field: Core.DisplayField<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const templateData = useTemplateData<Core.DisplayField<string>, ExtraProps>(field);

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
    templateData,
  };
}
