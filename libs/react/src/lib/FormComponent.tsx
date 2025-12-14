import * as Core from '@golemui/core';
import { useEffect, useRef, useState } from 'react';
import FieldRenderer from './FieldRenderer';
import { ReactFormContextProvider } from './ReactFormContextProvider';

type JsonStringified = string;
type JsonObject = Record<string, any>;

export interface FormComponentProps {
  formDef: JsonStringified | JsonObject;
  fieldLoaders: Core.FieldLoaders<React.ComponentType<Core.WithField>>;
  validators: Core.ValidatorFn<any>;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  formEvent?: (event: Core.FormEvent) => void;
  formError?: (error: Core.FormStoreError) => void;
}

export function FormComponent({
  formDef,
  fieldLoaders,
  middlewares,
  validators,
  validateOn,
  data,
  formName,
  formError,
  formEvent,
}: FormComponentProps) {
  const formContextRef = useRef<Core.FormContext<React.ComponentType<Core.WithField>>>(
    new Core.FormContext(),
  );
  const formNameRef = useRef(formName || Core.shortUUID());
  const [formLayoutField, setFormLayoutField] = useState<Core.LayoutField<string> | null>(null);

  // INITIALIZE FORM CONTEXT
  useEffect(() => {
    formContextRef.current.initialize(fieldLoaders, middlewares, validators, validateOn || 'eager');
  }, [fieldLoaders, middlewares, validators, validateOn]);

  // ERRORS
  useEffect(() => {
    const sub = Core.formErrors(formContextRef.current.store.state$).subscribe((error) =>
      formError?.(error),
    );
    return () => {
      sub.unsubscribe();
    };
  }, [formError]);

  // EVENTS
  useEffect(() => {
    const sub = formContextRef.current.events$.subscribe((event) => formEvent?.(event));
    return () => {
      sub.unsubscribe();
    };
  }, [formEvent]);

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

  return (
    <ReactFormContextProvider formContext={formContextRef.current}>
      <div className="gui-form">
        <form id={formNameRef.current}>
          <FieldRenderer field={formLayoutField} />
        </form>
      </div>
    </ReactFormContextProvider>
  );
}

export default FormComponent;
