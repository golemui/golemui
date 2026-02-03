import * as Core from '@golemui/core';
import { useCallback, useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';
import { useTemplateData } from './internal/useExtraProps';

export function useLayoutField<ExtraProps extends Record<string, any>>(
  field: Core.LayoutWidget<string>,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [children, setChildren] = useState<Core.FormWidget<string>[]>([]);
  const templateData = useTemplateData<Core.LayoutWidget<string>, ExtraProps>(field);

  useEffect(() => {
    setUid(field.uid);
  }, [field]);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_WIDGET',
      payload: { widget: field },
    });
  }, [field, formContext.store]);

  // Listen to the layout's `hidden`-flag-filtered children stream
  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.calculatedLayoutChildrenByUid$(field.uid))
      .subscribe(setChildren);
    return () => sub.unsubscribe();
  }, [formContext.store, field]);

  useEffect(() => {
    return () => {
      formContext.store.dispatch({
        type: 'REMOVE_WIDGET',
        payload: { uid: field.uid },
      });
    };
  }, [formContext, field]);

  const onChange = useCallback(
    (detail: any) => {
      formContext.emitEvent('change', field, detail);
    },
    [field, formContext],
  );

  return {
    uid,
    children,
    templateData,
    onChange,
  };
}
