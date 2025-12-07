import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { useReactFormContext } from '../../ReactFormContext';

export function useExtraProps<ExtraProps extends Record<string, any>>(
  field: Core.FormField<string>,
) {
  const [props, setProps] = useState<ExtraProps>((field.props || {}) as ExtraProps);
  const { formContext } = useReactFormContext();

  useEffect(() => {
    const destroy$ = new Subject<void>();
    Core.propsUpdaterByCurrentState({
      field,
      context: formContext,
      updaterFn: (updatedProps) => {
        setProps({
          ...(field.props as ExtraProps),
          ...updatedProps,
        });
      },
      destroy$,
    });
    return () => destroy$.next();
  }, [field, formContext]);

  return props;
}
