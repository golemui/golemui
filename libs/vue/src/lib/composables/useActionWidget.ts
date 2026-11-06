import { type ActionWidget, widgetViewModel$ } from '@golemui/core';
import { onMounted, onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

export interface UseActionWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  /**
   * The form's `formName`. Every DOM id the widget renders starts with it, so two forms on one
   * page never share an id: pass it as `idPrefix` to GolemUI Components.
   */
  formName: string;
  templateData: Ref<WithFlattenedProps<ActionWidget<string>, ExtraProps> & { invalid: boolean }>;
  /** Kept for existing templates. `templateData.invalid` is the portable form the other three use. */
  invalid: Ref<boolean>;
  onClick: () => void;
  /**
   * Emits `click` with a detail, such as the value of the item picked in a menu. `onClick` takes
   * no detail, so a DOM event bound to it never ends up in the form event.
   */
  emitClick: (detail?: unknown) => void;
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

  const emitClick = (detail?: unknown) => {
    if (disposed) {
      return;
    }
    formContext.emitEvent('click', widget, detail);
  };

  const onClick = () => emitClick();

  return {
    uid,
    formName: formContext.formName,
    templateData,
    invalid,
    onClick,
    emitClick,
  };
}
