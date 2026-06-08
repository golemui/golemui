import type { ActionWidget } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { distinctUntilChanged, map, Subject, takeUntil } from 'rxjs';
import { useVueFormContext } from '../provideFormContext';
import { useTemplateData, type WithFlattenedProps } from './useTemplateData';

export interface UseActionWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  templateData: Ref<WithFlattenedProps<ActionWidget<string>, ExtraProps>>;
  invalid: Ref<boolean>;
  onClick: () => void;
}

export function useActionWidget<ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: ActionWidget<string>,
): UseActionWidgetReturn<ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref('');
  const templateData = useTemplateData<ActionWidget<string>, ExtraProps>(widget);
  const invalid = ref(false);

  uid.value = widget.uid;
  formContext.store.dispatch({ type: 'ADD_WIDGET', payload: { widget } });
  formContext.emitEvent('load', widget);

  const destroy$ = new Subject<void>();

  formContext.store.state$
    .pipe(
      takeUntil(destroy$),
      map((state) => state.touched && !state.isFormValid),
      distinctUntilChanged(),
    )
    .subscribe((isInvalid) => {
      invalid.value = isInvalid;
    });

  // See `useInputWidget` for the rationale — same teardown race applies here.
  let disposed = false;

  onScopeDispose(() => {
    disposed = true;
    destroy$.next();
    destroy$.complete();
    formContext.store.dispatch({ type: 'REMOVE_WIDGET', payload: { uid: widget.uid } });
  });

  const onClick = () => {
    if (disposed) {
      return;
    }
    formContext.emitEvent('click', widget);
  };

  return { uid, templateData, invalid, onClick };
}
