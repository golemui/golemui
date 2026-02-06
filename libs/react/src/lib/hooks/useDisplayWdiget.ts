import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useDisplayWdiget<ExtraProps extends Record<string, any>>(
  widget: Core.DisplayWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const templateData = useTemplateData<Core.DisplayWidget<string>, ExtraProps>(widget);

  useEffect(() => {
    setUid(widget.uid);
  }, [widget]);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: widget },
    });
  }, [widget, formContext.store]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: widget.uid },
      });
    };
  }, [formContext, widget]);
  return {
    uid,
    templateData,
  };
}
