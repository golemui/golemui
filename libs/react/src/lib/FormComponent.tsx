import {
  FormContext,
  type FormEvent,
  type FormHealth,
  formHealth as watchFormHealth,
  type LayoutWidget,
  type ValidatorFn,
  type WithWidget,
  getDirectionFromLanguage,
  shortUUID,
  type FormSubmitEvent,
} from '@golemui/core';
import { type FormInitConfig } from '@golemui/core';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ReactFormContextProvider } from './ReactFormContextProvider';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import WidgetRenderer from './WidgetRenderer';

export interface FormComponentHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}

export interface FormComponentProps {
  config: FormInitConfig<React.ComponentType<WithWidget>>;
  validators: ValidatorFn<any>;
  formEvent?: (event: FormEvent) => void;
  formSubmit?: (event: FormSubmitEvent) => void;
  formHealth?: (error: FormHealth) => void;
  autocomplete?: string;
}

export const FormComponent = forwardRef<FormComponentHandle, FormComponentProps>(
  function FormComponent(
    { config, validators, formHealth, formEvent, formSubmit, autocomplete },
    ref,
  ) {
    const formContextRef = useRef<FormContext<React.ComponentType<WithWidget>>>(new FormContext());
    const formNameRef = useRef<string>(config.formName ?? shortUUID());
    const [formLayoutField, setFormLayoutField] = useState<LayoutWidget<string> | null>(null);
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

    const callbacksRef = useRef({ formHealth, formEvent, formSubmit });
    callbacksRef.current = { formHealth, formEvent, formSubmit };

    useEffect(() => {
      const context = formContextRef.current;
      context.initialize(
        config.widgetLoaders,
        config.middlewares ?? [],
        validators,
        config.validateOn ?? 'eager',
        config.itemRenderers ?? {},
        config.localization,
        config.dependencies ?? {},
      );
      context.store.dispatch({
        type: 'INITIALIZE',
        payload: { formName: formNameRef.current, formDef: config.formDef },
      });
      context.store.dispatch({ type: 'SET_DATA', payload: { data: config.data ?? {} } });
      context.store.dispatch({ type: 'SET_META', payload: { meta: config.meta ?? {} } });
      setDirection(getDirectionFromLanguage(context.localization.lang));

      const stateSub = context.store.state$.subscribe((state) => {
        setFormLayoutField(state.formDef.form);
        setDirection(getDirectionFromLanguage(context.localization.lang));
      });
      const healthSub = watchFormHealth(context.store.state$).subscribe((health) =>
        callbacksRef.current.formHealth?.(health),
      );
      const unsubscribeI18n = context.localization.subscribe((lang) => {
        setDirection(getDirectionFromLanguage(lang));
        context.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang } });
      });

      return () => {
        stateSub.unsubscribe();
        healthSub.unsubscribe();
        unsubscribeI18n();
      };
    }, [config, validators]);

    useEffect(() => {
      const context = formContextRef.current;
      const eventSub = context.events$.subscribe((event) =>
        callbacksRef.current.formEvent?.(event),
      );
      const submitSub = context.submit$.subscribe((event) =>
        callbacksRef.current.formSubmit?.(event),
      );
      return () => {
        eventSub.unsubscribe();
        submitSub.unsubscribe();
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        setData: (data) => {
          formContextRef.current.store.dispatch({ type: 'SET_DATA', payload: { data } });
        },
        setMeta: (meta) => {
          formContextRef.current.store.dispatch({ type: 'SET_META', payload: { meta } });
        },
      }),
      [],
    );

    const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      formContextRef.current.emitSubmitEvent();
    };

    if (!formLayoutField) {
      return null;
    }

    return (
      <ReactFormContextProvider formContext={formContextRef.current}>
        <div className="gui-form">
          <form
            id={formNameRef.current}
            noValidate
            dir={direction}
            autoComplete={autocomplete}
            onSubmit={onFormSubmit}
          >
            <WidgetErrorBoundary widget={formLayoutField}>
              <WidgetRenderer widget={formLayoutField} />
            </WidgetErrorBoundary>
          </form>
        </div>
      </ReactFormContextProvider>
    );
  },
);

export default FormComponent;
