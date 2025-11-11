import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { combineLatest, map, of } from 'rxjs';
import { useReactFormContext } from '../ReactFormContext';
import { useExtraProps } from './internal/useExtraProps';

export function useLayout<ExtraProps extends Record<string, any>>(field: Core.LayoutField) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [children, setChildren] = useState<Core.FormField<string>[]>([]);
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

  // Listen to the fieldFlags stream and filter the layout's `children` based on their `hidden` flag
  useEffect(() => {
    const selectFieldFlags = formContext.store.state$.pipe(Core.selectFieldFlags);
    const sub = combineLatest([of(field.children), selectFieldFlags])
      .pipe(
        map(([children]) => {
          const fieldFlags = formContext.store.getState().fieldFlags;
          return children.filter(
            (child) => fieldFlags[child.uid] === undefined || !fieldFlags[child.uid].hidden,
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
    props,
  };
}
