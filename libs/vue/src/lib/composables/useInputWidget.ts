import {
  type InputWidget,
  dataByPath$,
  injectedValidationByPath$,
  touchedControlsByPath$,
  validationByPath$,
} from '@golemui/core';
import { onScopeDispose, ref, type Ref } from 'vue';
import { combineLatest } from 'rxjs';
import { useVueFormContext } from '../provideFormContext';
import { useTemplateData, type WithFlattenedProps } from './useTemplateData';

export interface UseInputWidgetReturn<T, ExtraProps extends Record<string, any>> {
  uid: Ref<string>;
  value: Ref<T | undefined>;
  templateData: Ref<WithFlattenedProps<InputWidget<T, string>, ExtraProps>>;
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
  const uid = ref('');
  const value = ref<T | undefined>(undefined) as Ref<T | undefined>;
  const errors = ref<string[]>([]);
  const isTouched = ref<boolean | undefined>(undefined);

  const templateData = useTemplateData<InputWidget<T, string>, ExtraProps>(widget);

  formContext.store.dispatch({ type: 'ADD_WIDGET', payload: { widget } });
  formContext.store.dispatch({
    type: 'SET_WIDGET_INITIAL_DATA',
    payload: { data: widget.defaultValue, path: widget.path },
  });
  uid.value = widget.uid;

  const dataSub = formContext.store.state$
    .pipe(dataByPath$<T>(widget.path))
    .subscribe((next) => (value.value = next));

  const validation$ = formContext.store.state$.pipe(validationByPath$(widget.path));
  const injected$ = formContext.store.state$.pipe(injectedValidationByPath$(widget.path));
  const validationSub = combineLatest([validation$, injected$]).subscribe(
    ([validation, injectedValidation]) => {
      errors.value = [...(validation ?? []), ...(injectedValidation ?? [])];
    },
  );

  const touchedSub = formContext.store.state$
    .pipe(touchedControlsByPath$(widget.path))
    .subscribe((touched) => (isTouched.value = touched));

  formContext.emitEvent('load', widget);

  onScopeDispose(() => {
    dataSub.unsubscribe();
    validationSub.unsubscribe();
    touchedSub.unsubscribe();
    formContext.store.dispatch({ type: 'REMOVE_WIDGET', payload: { uid: widget.uid } });
  });

  const onValueChanged = (newValue: T) => {
    formContext.store.dispatch({
      type: 'SET_WIDGET_DATA',
      payload: { path: widget.path, data: newValue },
    });
    formContext.emitEvent('change', widget);
  };

  const onFilter = (newValue: T) => {
    formContext.emitEvent('filter', widget, newValue);
  };

  const injectValidationIssues = (issues: string[] | null) => {
    formContext.store.dispatch({
      type: 'INJECT_VALIDATION_ISSUES',
      payload: { path: widget.path, issues },
    });
  };

  const onBlur = () => {
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
