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

  // Vue keeps native DOM event listeners (e.g. @blur on <input>) bound until DOM
  // removal, so a focused input losing focus during unmount (browser back-nav,
  // route change, modal close…) can fire a `blur` after REMOVE_WIDGET ran. Any
  // dispatch on a removed widget crashes the reducer (state.calculatedWidgets[uid]
  // is undefined). React escapes this via its synthetic event teardown; Vue
  // doesn't, so we gate every dispatcher behind this flag.
  let disposed = false;

  onScopeDispose(() => {
    disposed = true;
    dataSub.unsubscribe();
    validationSub.unsubscribe();
    touchedSub.unsubscribe();
    formContext.store.dispatch({ type: 'REMOVE_WIDGET', payload: { uid: widget.uid } });
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
