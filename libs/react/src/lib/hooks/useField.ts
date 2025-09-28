import * as Core from '@formforge/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../ReactFormContext';

export function useField<ExtraProps extends Record<string, any>>(
  field: Core.Field,
) {
  const { formContext } = useReactFormContext();
  const [uid, setUid] = useState('');
  const [props, setProps] = useState({} as ExtraProps);

  useEffect(() => {
    setUid(field.uid);
    setProps((field.props || {}) as ExtraProps);
  }, [field]);

  useEffect(() => {
    formContext.store.dispatch({
      type: 'ADD_FIELD',
      payload: { field },
    });
  }, [field, formContext.store]);

  useEffect(() => {
    const sub = formContext.store.state$
      .pipe(Core.currentStates)
      .subscribe(() => {
        const props = field.props;
        if (props !== undefined) {
          // we dont want 'label.register', we only want the base keys 'label' (even if they are not set)
          const uniquePropsWithoutState = Array.from(
            new Set(
              Object.keys(props).map((prop) => prop.split('.')[0]),
            ).keys(),
          );
          const updatedProps = uniquePropsWithoutState.reduce(
            (templateData, key: keyof ExtraProps) => {
              templateData[key] = formContext.getPropertyValueByCurrentState(
                key as string,
                props,
              ) as any;
              return templateData;
            },
            {} as ExtraProps,
          );
          setProps({
            ...props,
            ...updatedProps,
          });
        }
      });
    return () => sub.unsubscribe();
  }, [field.props, formContext]);

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
    props,
  };
}
