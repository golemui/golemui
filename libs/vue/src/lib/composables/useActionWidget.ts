import { type ActionWidget, widgetViewModel$ } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

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
  const uid = ref(widget.uid);
  const templateData = ref({}) as Ref<WithFlattenedProps<ActionWidget<string>, ExtraProps>>;
  const invalid = ref(false);

  const viewModelSub = formContext.store.state$
    .pipe(widgetViewModel$(widget.uid))
    .subscribe((viewModel) => {
      invalid.value = viewModel.formInvalid;
      mergeViewModelIntoTemplateData(templateData, viewModel, formContext.dependencies);
    });

  formContext.emitEvent('load', widget);

  // Same teardown race as `useInputWidget`.
  let disposed = false;

  onScopeDispose(() => {
    disposed = true;
    viewModelSub.unsubscribe();
  });

  const onClick = () => {
    if (disposed) {
      return;
    }
    formContext.emitEvent('click', widget);
  };

  return { uid, templateData, invalid, onClick };
}
