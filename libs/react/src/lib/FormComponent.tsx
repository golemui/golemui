import * as Core from '@golemui/core';
import { memo, useEffect, useRef, useState } from 'react';
import FieldRenderer from './FieldRenderer';
import { ReactFormContextProvider } from './ReactFormContextProvider';

type JsonStringified = string;
type JsonObject = Record<string, any>;

export interface FormComponentProps {
  formDef: JsonStringified | JsonObject;
  fieldLoader: Core.FieldLoaders<React.ComponentType<Core.WithField>>;
  validators: Core.ValidatorFn<any>;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  onFormEvent?: (event: Core.FormEvent) => void;
  onFormError?: (error: Core.FormStoreError) => void;
}

export function FormComponent({
  formDef,
  fieldLoader,
  middlewares,
  validators,
  validateOn,
  data,
  formName,
  onFormError,
  onFormEvent,
}: FormComponentProps) {
  const formContextRef = useRef<Core.FormContext<React.ComponentType<Core.WithField>>>(
    new Core.FormContext(),
  );
  const formNameRef = useRef(formName || Core.shortUUID());
  const [formLayoutField, setFormLayoutField] = useState<Core.LayoutField<string> | null>(null);

  // INITIALIZE FORM CONTEXT
  useEffect(() => {
    formContextRef.current.initialize(fieldLoader, middlewares, validators, validateOn || 'eager');
  }, [fieldLoader, middlewares, validators, validateOn]);

  // ERRORS
  useEffect(() => {
    const sub = Core.formErrors(formContextRef.current.store.state$).subscribe((error) =>
      onFormError?.(error),
    );
    return () => {
      sub.unsubscribe();
    };
  }, [onFormError]);

  // EVENTS
  useEffect(() => {
    const sub = formContextRef.current.events$.subscribe((event) => onFormEvent?.(event));
    return () => {
      sub.unsubscribe();
    };
  }, [onFormEvent]);

  // FORM ENTRY POINT
  useEffect(() => {
    const sub = formContextRef.current.store.state$.subscribe((state) => {
      setFormLayoutField(state.formDef.form);
    });
    return () => {
      sub.unsubscribe();
    };
  }, []);

  // INITIALIZE FORM
  useEffect(() => {
    formContextRef.current.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: formNameRef.current,
        formDef: formDef,
      },
    });
  }, [formDef]);

  // SET FORM DATA
  useEffect(() => {
    formContextRef.current.store.dispatch({
      type: 'SET_DATA',
      payload: { data: data || {} },
    });
  }, [data]);

  if (!formLayoutField) {
    return null;
  }

  // Wrap FieldRenderer in a memo to force React to evaluate it only after the provider is mounted
  const SafeFieldRenderer = memo(FieldRenderer);

  return (
    <ReactFormContextProvider formContext={formContextRef.current}>
      <div className="gui-form">
        <form id={formNameRef.current}>
          <SafeFieldRenderer field={formLayoutField} />
        </form>
      </div>
    </ReactFormContextProvider>
  );
}

export default FormComponent;
