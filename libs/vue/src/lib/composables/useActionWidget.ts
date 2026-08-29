import { type ActionWidget, widgetViewModel$ } from '@golemui/core';
import { onMounted, onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

export interface UseActionWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  templateData: Ref<WithFlattenedProps<ActionWidget<string>, ExtraProps> & { invalid: boolean }>;
  /** Kept for existing templates. `templateData.invalid` is the portable form the other three use. */
  invalid: Ref<boolean>;
  onClick: () => void;
}

export function useActionWidget<ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: ActionWidget<string>,
): UseActionWidgetReturn<ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref(widget.uid);
  const templateData = ref({}) as Ref<
    WithFlattenedProps<ActionWidget<string>, ExtraProps> & { invalid: boolean }
  >;
  const invalid = ref(false);

  const viewModelSub = formContext.store.state$
    .pipe(widgetViewModel$(widget.uid))
    .subscribe((viewModel) => {
      invalid.value = viewModel.formInvalid;
      mergeViewModelIntoTemplateData(templateData, viewModel, formContext.dependencies, (vm) => ({
        invalid: vm.formInvalid,
      }));
    });

  onMounted(() => formContext.emitEvent('load', widget));

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
