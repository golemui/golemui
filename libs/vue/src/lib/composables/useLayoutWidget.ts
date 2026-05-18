import { type FormWidget, type LayoutWidget, calculatedLayoutChildrenByUid$ } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { useTemplateData, type WithFlattenedProps } from './useTemplateData';

export interface UseLayoutWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  children: Ref<FormWidget<string>[]>;
  templateData: Ref<WithFlattenedProps<LayoutWidget<string>, ExtraProps>>;
  onChange: (detail: any) => void;
}

export function useLayoutWidget<ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: LayoutWidget<string>,
): UseLayoutWidgetReturn<ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref('');
  const children = ref<FormWidget<string>[]>([]) as Ref<FormWidget<string>[]>;
  const templateData = useTemplateData<LayoutWidget<string>, ExtraProps>(widget);

  uid.value = widget.uid;
  formContext.store.dispatch({ type: 'ADD_WIDGET', payload: { widget } });

  const childrenSub = formContext.store.state$
    .pipe(calculatedLayoutChildrenByUid$(widget.uid))
    .subscribe((next) => (children.value = next));

  onScopeDispose(() => {
    childrenSub.unsubscribe();
    formContext.store.dispatch({ type: 'REMOVE_WIDGET', payload: { uid: widget.uid } });
  });

  const onChange = (detail: any) => {
    formContext.emitEvent('change', widget, detail);
  };

  return { uid, children, templateData, onChange };
}
