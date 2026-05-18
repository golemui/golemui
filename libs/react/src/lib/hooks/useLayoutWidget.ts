import { type FormWidget, type LayoutWidget, calculatedLayoutChildrenByUid$ } from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useLayoutWidget<ExtraProps extends Record<string, any>>(
  widget: LayoutWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [children, setChildren] = useState<FormWidget<string>[]>([]);
  const templateData = useTemplateData<LayoutWidget<string>, ExtraProps>(widget);

  useEffect(() => {
    setUid(widget.uid);
  }, [widget]);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: widget },
    });
  }, [widget, formContext.store]);

  // Listen to the layout's `hidden`-flag-filtered children stream
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(calculatedLayoutChildrenByUid$(widget.uid))
      .subscribe(setChildren);
    return () => sub.unsubscribe();
  }, [formContext.store, widget]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: widget.uid },
      });
    };
  }, [formContext, widget]);

  const onChange = useCallback(
    (detail: any) => {
      formContext.emitEvent('change', widget, detail);
    },
    [widget, formContext],
  );

  return {
    uid,
    children,
    templateData,
    onChange,
  };
}
