import {
  type NonFunctionWidget,
  assertNoPropCollisions,
  calculatedWidgetsByUid$,
} from '@golemui/core';
import { useEffect, useState } from 'react';
import { Subject, takeUntil } from 'rxjs';
import { useReactFormContext } from '../../ReactFormContext';

export type WithFlattenedProps<
  F extends NonFunctionWidget<string>,
  ExtraProps extends NonFunctionWidget<string>['props'],
> = F & ExtraProps & { lang: string; deps: Record<string, unknown> };

export function useTemplateData<
  F extends NonFunctionWidget<string>,
  ExtraProps extends NonFunctionWidget<string>['props'],
>(widget: F) {
  const [templateData, setTemplateData] = useState<WithFlattenedProps<F, ExtraProps>>(
    {} as WithFlattenedProps<F, ExtraProps>,
  );
  const { formContext } = useReactFormContext();

  useEffect(() => {
    const destroy$ = new Subject<void>();
    formContext.store.state$
      .pipe(takeUntil(destroy$), calculatedWidgetsByUid$(widget.uid))
      .subscribe((calculatedWidget) => {
        const obj = {
          ...calculatedWidget,
          lang: formContext.store.getState().lang,
          deps: formContext.dependencies,
        };
        assertNoPropCollisions(calculatedWidget['uid'], calculatedWidget.props, obj);
        const templateData = {
          ...widget,
          ...obj,
          ...calculatedWidget.props,
        } as unknown as WithFlattenedProps<F, ExtraProps>;
        setTemplateData(templateData);
      });

    return () => destroy$.next();
  }, [widget, formContext]);

  return templateData;
}
