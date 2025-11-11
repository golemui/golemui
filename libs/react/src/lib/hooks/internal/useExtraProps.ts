import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { useReactFormContext } from '../../ReactFormContext';

export function useExtraProps<ExtraProps extends Record<string, any>>(
  field: Core.FormField<string>,
) {
  const [props, setProps] = useState<ExtraProps>((field.props || {}) as ExtraProps);
  const { formContext } = useReactFormContext();

  useEffect(() => {
    const sub = formContext.store.state$.pipe(Core.currentStates).subscribe(() => {
      const fieldProps = field.props;
      if (fieldProps !== undefined) {
        // we dont want 'label.register', we only want the base keys 'label' (even if they are not set)
        const uniquePropsWithoutState = Array.from(
          new Set(Object.keys(fieldProps).map((prop) => prop.split('.')[0])).keys(),
        );
        const updatedProps = uniquePropsWithoutState.reduce(
          (templateData, key: keyof ExtraProps) => {
            templateData[key] = formContext.getPropertyValueByCurrentState(
              key as string,
              fieldProps,
            ) as any;
            return templateData;
          },
          {} as ExtraProps,
        );
        setProps({
          ...fieldProps,
          ...updatedProps,
        });
      }
    });
    return () => sub.unsubscribe();
  }, [field.props, formContext]);

  return props;
}
