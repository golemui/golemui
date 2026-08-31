import { type InputWidget, type NonFunctionWidget, widgetViewModel$ } from '@golemui/core';
import { onMounted, onScopeDispose, ref, type Ref } from 'vue';
import { useVueFormContext } from '../provideFormContext';
import { mergeViewModelIntoTemplateData, type WithFlattenedProps } from './template-data';

export interface UseInputWidgetReturn<T, ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  value: Ref<T | undefined>;
  templateData: Ref<
    WithFlattenedProps<InputWidget<T, string>, ExtraProps> & {
      /**
       * Repeater inputs only: one row layout node per row of the array value, uid and path
       * already indexed.
       */
      rows?: NonFunctionWidget<string>[];
    }
  >;
  errors: Ref<string[]>;
  isTouched: Ref<boolean | undefined>;
  onValueChanged: (newValue: T) => void;
  onFilter: (newValue: T) => void;
  onBlur: () => void;
  injectValidationIssues: (issues: string[] | null) => void;
}

export function useInputWidget<T, ExtraProps extends Record<string, any> = Record<string, any>>(
  widget: InputWidget<T, string>,
): UseInputWidgetReturn<T, ExtraProps> {
  const formContext = useVueFormContext();
  const uid = ref(widget.uid);
  const value = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const errors = ref<string[]>([]);
  const isTouched = ref<boolean | undefined>(undefined);
  const templateData = ref({}) as UseInputWidgetReturn<T, ExtraProps>['templateData'];

  const viewModelSub = formContext.store.state$
    .pipe(widgetViewModel$<T>(widget.uid))
    .subscribe((viewModel) => {
      value.value = viewModel.value;
      // `errors` is shared between widgets while the form is untouched, so never write into it.
      errors.value = viewModel.errors;
      isTouched.value = viewModel.touched;
      mergeViewModelIntoTemplateData(templateData, viewModel, formContext.dependencies, (vm) =>
        // Keep the last rows while hidden, the view model empties them.
        vm.widget !== undefined ? { rows: vm.rows } : {},
      );
    });

  onMounted(() => formContext.emitEvent('load', widget));

  // Vue keeps DOM listeners bound until the node is removed, so a blur during unmount can fire
  // after this scope was disposed. A late SET_WIDGET_DATA would re-create a removed row's data
  // containers through set() and bring the row back, and a late ATTEMPT_VALIDATION would mark
  // the whole form touched.
  let disposed = false;

  onScopeDispose(() => {
    disposed = true;
    viewModelSub.unsubscribe();
  });

  const onValueChanged = (newValue: T) => {
    if (disposed) return;
    formContext.store.dispatch({
      type: 'SET_WIDGET_DATA',
      payload: { path: widget.path, data: newValue },
    });
    formContext.emitEvent('change', widget);
  };

  const onFilter = (newValue: T) => {
    if (disposed) return;
    formContext.emitEvent('filter', widget, newValue);
  };

  const injectValidationIssues = (issues: string[] | null) => {
    if (disposed) return;
    formContext.store.dispatch({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path: widget.path, issues },
    });
  };

  const onBlur = () => {
    if (disposed) return;
    formContext.store.dispatch({
      type: 'ATTEMPT_VALIDATION',
      payload: { reason: 'blur', path: widget.path, uid: widget.uid },
    });
    formContext.emitEvent('blur', widget);
  };

  return {
    uid,
    value,
    templateData,
    errors,
    isTouched,
    onValueChanged,
    onFilter,
    onBlur,
    injectValidationIssues,
  };
}
