import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useActionWidget<ExtraProps extends Record<string, any>>(
  widget: Core.ActionWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const templateData = useTemplateData<Core.ActionWidget<string>, ExtraProps>(widget);

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
    formContext.emitEvent('load', widget);
  }, [formContext, widget]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: widget.uid },
      });
    };
  }, [formContext, widget]);

  const onClick = useCallback(() => {
    formContext.emitEvent('click', widget);
  }, [widget, formContext]);

  return {
    uid,
    templateData,
    onClick,
  };
}
