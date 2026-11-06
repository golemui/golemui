import { type DisplayWidget, widgetViewModel$ } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

export interface UseDisplayWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  /**
   * The form's `formName`. Every DOM id the widget renders starts with it, so two forms on one
   * page never share an id: pass it as `idPrefix` to GolemUI Components.
   */
  formName: string;
  templateData: Ref<WithFlattenedProps<DisplayWidget<string>, ExtraProps>>;
}

export function useDisplayWidget<ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: DisplayWidget<string>,
): UseDisplayWidgetReturn<ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref(widget.uid);
  const templateData = ref({}) as Ref<WithFlattenedProps<DisplayWidget<string>, ExtraProps>>;

  const viewModelSub = formContext.store.state$
    .pipe(widgetViewModel$(widget.uid))
    .subscribe((viewModel) => {
      mergeViewModelIntoTemplateData(templateData, viewModel, formContext.dependencies);
    });

  onScopeDispose(() => {
    viewModelSub.unsubscribe();
  });

  return {
    uid,
    formName: formContext.formName,
    templateData,
  };
}
