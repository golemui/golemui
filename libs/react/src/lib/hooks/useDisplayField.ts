import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useDisplayField<ExtraProps extends Record<string, any>>(
  field: Core.DisplayWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const templateData = useTemplateData<Core.DisplayWidget<string>, ExtraProps>(field);

  useEffect(() => {
    setUid(field.uid);
  }, [field]);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: field },
    });
  }, [field, formContext.store]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: field.uid },
      });
    };
  }, [formContext, field]);
  return {
    uid,
    templateData,
  };
}
