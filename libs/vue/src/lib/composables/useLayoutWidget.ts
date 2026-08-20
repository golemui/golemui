import { type FormWidget, type LayoutWidget, widgetViewModel$ } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

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
  const uid = ref(widget.uid);
  const children = ref<FormWidget<string>[]>([]) as Ref<FormWidget<string>[]>;
  const templateData = ref({}) as Ref<WithFlattenedProps<LayoutWidget<string>, ExtraProps>>;

  const viewModelSub = formContext.store.state$
    .pipe(widgetViewModel$(widget.uid))
    .subscribe((viewModel) => {
      // Keep the last children while hidden, otherwise the layout renders empty.
      if (viewModel.widget !== undefined) {
        children.value = viewModel.children;
      }
      mergeViewModelIntoTemplateData(templateData, viewModel, formContext.dependencies);
    });

  // Same teardown race as `useInputWidget`.
  let disposed = false;

  onScopeDispose(() => {
    disposed = true;
    viewModelSub.unsubscribe();
  });

  const onChange = (detail: any) => {
    if (disposed) return;
    formContext.emitEvent('change', widget, detail);
  };

  return { uid, children, templateData, onChange };
}
