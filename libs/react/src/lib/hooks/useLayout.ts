import * as Core from '@formforge/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';

export function useLayout(field: Core.LayoutField) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [children, setChildren] = useState<Core.FormField<string>[]>([]);

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
    const sub = Core.calculatedForm(formContext.store.state$).subscribe(
      (layout) => setChildren(layout.children),
    );
    return () => sub.unsubscribe();
  }, [formContext.store.state$]);

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
    children,
    formContext,
  };
}
