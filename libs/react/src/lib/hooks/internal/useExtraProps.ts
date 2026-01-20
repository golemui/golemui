import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { Subject, takeUntil } from 'rxjs';
import { useReactFormContext } from '../../ReactFormContext';

export type WithFlattenedProps<
  F extends Core.NonFunctionField<string>,
  ExtraProps extends Core.NonFunctionField<string>['props'],
> = F & ExtraProps & Core.On;

export function useTemplateData<
  F extends Core.NonFunctionField<string>,
  ExtraProps extends Core.NonFunctionField<string>['props'],
>(field: F) {
  // TODO: this should be [templateData, setTemplateData]
  const [props, setProps] = useState<WithFlattenedProps<F, ExtraProps>>(
    (field.props || {}) as WithFlattenedProps<F, ExtraProps>,
  );
  const { formContext } = useReactFormContext();

  useEffect(() => {
    const destroy$ = new Subject<void>();
    formContext.store.state$
      .pipe(takeUntil(destroy$), Core.calculatedFieldsByUid$(field.uid))
      .subscribe((calculatedField) => {
        const templateData = {
          ...calculatedField,
          ...calculatedField.props,
          ...(calculatedField as Core.InteractiveField).on,
        } as WithFlattenedProps<F, ExtraProps>;
        setProps(templateData);
      });
    return () => destroy$.next();
  }, [field, formContext]);

  return props;
}
