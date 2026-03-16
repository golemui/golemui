import * as Core from '@golemui/core';
import { useEffect, useState } from 'react';
import { Subject, takeUntil } from 'rxjs';
import { useReactFormContext } from '../../ReactFormContext';

export type WithFlattenedProps<
  F extends Core.NonFunctionWidget<string>,
  ExtraProps extends Core.NonFunctionWidget<string>['props'],
> = F & ExtraProps & { lang: string; deps: Record<string, unknown> };

export function useTemplateData<
  F extends Core.NonFunctionWidget<string>,
  ExtraProps extends Core.NonFunctionWidget<string>['props'],
>(widget: F) {
  const [templateData, setTemplateData] = useState<WithFlattenedProps<F, ExtraProps>>(
    {} as WithFlattenedProps<F, ExtraProps>,
  );
  const { formContext } = useReactFormContext();

  useEffect(() => {
    const destroy$ = new Subject<void>();
    formContext.store.state$
      .pipe(takeUntil(destroy$), Core.calculatedWidgetsByUid$(widget.uid))
      .subscribe((calculatedWidget) => {
        const templateData = {
          ...calculatedWidget,
          ...calculatedWidget.props,
          lang: formContext.store.getState().lang,
          deps: formContext.dependencies,
        } as unknown as WithFlattenedProps<F, ExtraProps>;
        setTemplateData(templateData);
      });
    return () => destroy$.next();
  }, [widget, formContext]);

  return templateData;
}
