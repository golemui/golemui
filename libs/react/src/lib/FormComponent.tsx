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
  dependencies?: Record<string, unknown>;
  validators: Core.ValidatorFn<any>;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  locale?: string;
  direction?: 'ltr' | 'rtl';
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (error: Core.FormHealth) => void;
}

export function FormComponent({
  formDef,
  widgetLoaders,
  itemRenderers,
  localization,
  locale,
  dependencies,
  middlewares,
  validators,
  validateOn,
  data,
  formName,
  direction: directionProp,
  formHealth,
  formEvent,
}: FormComponentProps) {
  const formContextRef = useRef<Core.FormContext<React.ComponentType<Core.WithWidget>>>(
    new Core.FormContext(),
  );
  const formNameRef = useRef(formName || Core.shortUUID());
  const [formLayoutField, setFormLayoutField] = useState<Core.LayoutWidget<string> | null>(null);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  // INITIALIZE FORM CONTEXT
  useEffect(() => {
    formContextRef.current.initialize(
      widgetLoaders,
      middlewares,
      validators,
      validateOn || 'eager',
      itemRenderers,
      localization,
      dependencies || {},
    );
  }, [
    widgetLoaders,
    middlewares,
    validators,
    validateOn,
    itemRenderers,
    localization,
    dependencies,
  ]);

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
      setDirection(Core.getDirectionFromLanguage(formContextRef.current.localization.lang));
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
      setDirection(Core.getDirectionFromLanguage(lang));
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

  // LOCALE
  useEffect(() => {
    if (locale) {
      setDirection(Core.getDirectionFromLanguage(locale));
      formContextRef.current.store.dispatch({
        type: 'SET_LANGUAGE',
        payload: { lang: locale },
      });
    }
  }, [locale]);

  if (!formLayoutField) {
    return null;
  }

  return (
    <ReactFormContextProvider formContext={formContextRef.current}>
      <div className="gui-form">
        <form id={formNameRef.current} noValidate dir={directionProp ?? direction}>
          <WidgetErrorBoundary widget={formLayoutField}>
            <WidgetRenderer widget={formLayoutField} />
          </WidgetErrorBoundary>
        </form>
      </div>
    </ReactFormContextProvider>
  );
}

export default FormComponent;
