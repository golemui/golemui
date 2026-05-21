import type { DisplayWidget } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { useTemplateData, type WithFlattenedProps } from './useTemplateData';

export interface UseDisplayWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  templateData: Ref<WithFlattenedProps<DisplayWidget<string>, ExtraProps>>;
}

export function useDisplayWidget<ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: DisplayWidget<string>,
): UseDisplayWidgetReturn<ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref('');
  const templateData = useTemplateData<DisplayWidget<string>, ExtraProps>(widget);

  uid.value = widget.uid;
  formContext.store.dispatch({ type: 'ADD_WIDGET', payload: { widget } });

  onScopeDispose(() => {
    formContext.store.dispatch({ type: 'REMOVE_WIDGET', payload: { uid: widget.uid } });
  });

  return { uid, templateData };
}
