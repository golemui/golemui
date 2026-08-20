import { type DisplayWidget, widgetViewModel$ } from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

export interface UseDisplayWidgetReturn<ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
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

  return { uid, templateData };
}
