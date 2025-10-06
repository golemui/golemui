import * as Core from '@formforge/core';
import { useEffect, useState } from 'react';
import { combineLatest, map, Observable, of } from 'rxjs';
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
    const children: Observable<Core.FormField<string>[]> = of(field.children);
    const selectFieldFlags = formContext.store.state$.pipe(
      Core.selectFieldFlags,
    );
    const sub = combineLatest([children, selectFieldFlags])
      .pipe(
        map(([children]) => {
          const fieldFlags = formContext.store.getState().fieldFlags;
          return children.filter(
            (child) =>
              fieldFlags[child.uid] === undefined ||
              !fieldFlags[child.uid].hidden,
          );
        }),
      )
      .subscribe(setChildren);
    return () => sub.unsubscribe();
  }, [field.children, formContext.store]);

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
