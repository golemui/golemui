import * as Core from '@golemui/core';
import { useEffect, useRef, useState } from 'react';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import WidgetRenderer from './WidgetRenderer';
import { ReactFormContextProvider } from './ReactFormContextProvider';

type JsonStringified = string;
type JsonObject = Record<string, any>;

export interface FormComponentProps {
  formDef: JsonStringified | JsonObject;
  widgetLoaders: Core.WidgetLoaders<React.ComponentType<Core.WithWidget>>;
  itemRenderers: Record<string, Core.ItemRenderer>;
  localization?: Core.I18nTranslator;
  validators: Core.ValidatorFn<any>;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (error: Core.FormHealth) => void;
}

export function FormComponent({
  formDef,
  widgetLoaders,
  itemRenderers,
  localization,
  middlewares,
  validators,
  validateOn,
  data,
  formName,
  formHealth,
  formEvent,
}: FormComponentProps) {
  const formContextRef = useRef<Core.FormContext<React.ComponentType<Core.WithWidget>>>(
    new Core.FormContext(),
  );
  const formNameRef = useRef(formName || Core.shortUUID());
  const [formLayoutField, setFormLayoutField] = useState<Core.LayoutWidget<string> | null>(null);

  // INITIALIZE FORM CONTEXT
  useEffect(() => {
    formContextRef.current.initialize(
      widgetLoaders,
      middlewares,
      validators,
      validateOn || 'eager',
      itemRenderers,
      localization,
    );
  }, [widgetLoaders, middlewares, validators, validateOn, itemRenderers, localization]);

  // FORM HEALTH
  useEffect(() => {
    const sub = Core.formHealth(formContextRef.current.store.state$).subscribe((health) =>
      formHealth?.(health),
    );
    return () => {
      sub.unsubscribe();
    };
  }, [formHealth]);

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

  // I18n
  useEffect(() => {
    const sub = formContextRef.current.localization.subscribe((lang) => {
      formContextRef.current.store.dispatch({
        type: 'SET_LANGUAGE',
        payload: {
          lang,
        },
      });
    });
    return () => {
      sub();
    };
  }, []);

  if (!formLayoutField) {
    return null;
  }

  return (
    <ReactFormContextProvider formContext={formContextRef.current}>
      <div className="gui-form">
        <form id={formNameRef.current} noValidate>
          <WidgetErrorBoundary field={formLayoutField}>
            <WidgetRenderer widget={formLayoutField} />
          </WidgetErrorBoundary>
        </form>
      </div>
    </ReactFormContextProvider>
  );
}

export default FormComponent;
