import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { Subject, takeUntil } from 'rxjs';
import { useReactFormContext } from '../../ReactFormContext';

export type WithFlattenedProps<
  F extends Core.FormField<string>,
  ExtraProps extends Core.FormField<string>['props'],
> = F & ExtraProps & Core.On;

export function useTemplateData<
  F extends Core.FormField<string>,
  ExtraProps extends Core.FormField<string>['props'],
>(
  field: F,
  postUpdate?: (obj: WithFlattenedProps<F, ExtraProps>) => WithFlattenedProps<F, ExtraProps>,
) {
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
          ...(calculatedField as Core.On),
        } as WithFlattenedProps<F, ExtraProps>;
        setProps(postUpdate ? postUpdate(templateData) : templateData);
      });
    return () => destroy$.next();
  }, [field, formContext, postUpdate]);

  return props;
}
