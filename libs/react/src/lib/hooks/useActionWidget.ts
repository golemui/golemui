import type { ActionWidget } from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { distinctUntilChanged, map } from 'rxjs';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useActionWidget<ExtraProps extends Record<string, any>>(
  widget: ActionWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const templateData = useTemplateData<ActionWidget<string>, ExtraProps>(widget);
  const [invalid, setInvalid] = useState(false);

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

  useEffect(() => {
    const subscription = formContext.store.state$
      .pipe(
        map((state) => state.touched && !state.isFormValid),
        distinctUntilChanged(),
      )
      .subscribe((isInvalid) => {
        setInvalid(isInvalid);
      });
    return () => subscription.unsubscribe();
  }, [formContext.store.state$]);

  const onClick = useCallback(() => {
    formContext.emitEvent('click', widget);
  }, [widget, formContext]);

  return {
    uid,
    templateData: { ...templateData, invalid },
    onClick,
  };
}
