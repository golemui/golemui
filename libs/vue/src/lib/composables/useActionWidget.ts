import type { ActionWidget } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { useTemplateData, type WithFlattenedProps } from './useTemplateData';

export interface UseActionWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  templateData: Ref<WithFlattenedProps<ActionWidget<string>, ExtraProps>>;
  onClick: () => void;
}

export function useActionWidget<ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: ActionWidget<string>,
): UseActionWidgetReturn<ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref('');
  const templateData = useTemplateData<ActionWidget<string>, ExtraProps>(widget);

  uid.value = widget.uid;
  formContext.store.dispatch({ type: 'ADD_WIDGET', payload: { widget } });
  formContext.emitEvent('load', widget);

  onScopeDispose(() => {
    formContext.store.dispatch({ type: 'REMOVE_WIDGET', payload: { uid: widget.uid } });
  });

  const onClick = () => {
    formContext.emitEvent('click', widget);
  };

  return { uid, templateData, onClick };
}
