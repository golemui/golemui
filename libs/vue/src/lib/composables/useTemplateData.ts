import {
  type NonFunctionWidget,
  assertNoPropCollisions,
  calculatedWidgetsByUid$,
} from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { Subject, takeUntil } from 'rxjs';
import { useVueFormContext } from '../provideFormContext';

export type WithFlattenedProps<
  F extends NonFunctionWidget<string>,
  ExtraProps extends NonFunctionWidget<string>['props'],
> = F & ExtraProps & { lang: string; deps: Record<string, unknown> };

export function useTemplateData<
  F extends NonFunctionWidget<string>,
  ExtraProps extends NonFunctionWidget<string>['props'],
>(widget: F): Ref<WithFlattenedProps<F, ExtraProps>> {
  const formContext = useVueFormContext();
  const templateData = ref({} as WithFlattenedProps<F, ExtraProps>) as Ref<
    WithFlattenedProps<F, ExtraProps>
  >;

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
      templateData.value = {
        ...obj,
        ...calculatedWidget.props,
      } as unknown as WithFlattenedProps<F, ExtraProps>;
    });

  onScopeDispose(() => {
    destroy$.next();
    destroy$.complete();
  });

  return templateData;
}
