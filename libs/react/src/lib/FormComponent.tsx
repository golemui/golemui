import * as Core from '@golemui/core';
import { FormInitConfig } from '@golemui/core';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ReactFormContextProvider } from './ReactFormContextProvider';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import WidgetRenderer from './WidgetRenderer';

export interface FormComponentHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}

export interface FormComponentProps {
  config: FormInitConfig<React.ComponentType<Core.WithWidget>>;
  validators: Core.ValidatorFn<any>;
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (error: Core.FormHealth) => void;
  autocomplete?: string;
  ref?: React.Ref<FormComponentHandle>;
}

export function FormComponent({
  config,
  validators,
  formHealth,
  formEvent,
  autocomplete,
  ref,
}: FormComponentProps) {
  const formContextRef = useRef<Core.FormContext<React.ComponentType<Core.WithWidget>>>(
    new Core.FormContext(),
  );
  const formNameRef = useRef<string>(config.formName ?? Core.shortUUID());
  const [formLayoutField, setFormLayoutField] = useState<Core.LayoutWidget<string> | null>(null);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [storeVersion, setStoreVersion] = useState(0);

  // INITIALIZE FORM CONTEXT
  // Recreates the store when config reference changes (atomic reinit) or validators change.
  // Bumps storeVersion so downstream effects re-subscribe to the new store.
  useEffect(() => {
    formContextRef.current.initialize(
      config.widgetLoaders,
      config.middlewares ?? [],
      validators,
      config.validateOn ?? 'eager',
      config.itemRenderers ?? {},
      config.localization,
      config.dependencies ?? {},
    );
    setStoreVersion((v) => v + 1);
  }, [config, validators]);

  // INITIALIZE FORM DEFINITION
  // Re-dispatches when storeVersion bumps (new store) so the definition is always loaded.
  useEffect(() => {
    formContextRef.current.store.dispatch({
      type: 'INITIALIZE',
      payload: {
        formName: formNameRef.current,
        formDef: config.formDef,
      },
    });
  }, [config.formDef, storeVersion]);

  // FORM HEALTH
  // Re-subscribes when store is recreated (storeVersion changes).
  useEffect(() => {
    const sub = Core.formHealth(formContextRef.current.store.state$).subscribe((health) =>
      formHealth?.(health),
    );
    return () => {
      sub.unsubscribe();
    };
  }, [formHealth, storeVersion]);

  // EVENTS
  useEffect(() => {
    const sub = formContextRef.current.events$.subscribe((event) => formEvent?.(event));
    return () => {
      sub.unsubscribe();
    };
  }, [formEvent]);

  // FORM ENTRY POINT
  // Re-subscribes when store is recreated so the rendered form tree is always
  // consistent with the new store's flatForm and calculatedWidgets.
  useEffect(() => {
    const sub = formContextRef.current.store.state$.subscribe((state) => {
      setFormLayoutField(state.formDef.form);
      setDirection(Core.getDirectionFromLanguage(formContextRef.current.localization.lang));
    });
    return () => {
      sub.unsubscribe();
    };
  }, [storeVersion]);

  // SET FORM DATA
  // Also re-dispatches when the store is recreated so fresh store starts with the right data.
  useEffect(() => {
    formContextRef.current.store.dispatch({
      type: 'SET_DATA',
      payload: { data: config.data || {} },
    });
  }, [config.data, storeVersion]);

  // SET FORM META
  useEffect(() => {
    formContextRef.current.store.dispatch({
      type: 'SET_META',
      payload: { meta: config.meta || {} },
    });
  }, [config.meta, storeVersion]);

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

  if (!formLayoutField) {
    return null;
  }

  return (
    <ReactFormContextProvider formContext={formContextRef.current}>
      <div className="gui-form">
        <form id={formNameRef.current} noValidate dir={direction} autoComplete={autocomplete}>
          <WidgetErrorBoundary widget={formLayoutField}>
            <WidgetRenderer widget={formLayoutField} />
          </WidgetErrorBoundary>
        </form>
      </div>
    </ReactFormContextProvider>
  );
}

export default FormComponent;
