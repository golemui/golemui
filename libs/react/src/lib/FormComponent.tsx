import {
  FormContext,
  type FormEvent,
  type FormHealth,
  formHealth as watchFormHealth,
  type LayoutWidget,
  type ValidatorFn,
  type WithWidget,
  getDirectionFromLanguage,
  type FormSubmitEvent,
} from '@golemui/core';
import { type FormInitConfig } from '@golemui/core';
import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { DefaultFormHealthBoundary, type FormHealthBoundary } from './FormHealthBoundary';
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
  /** Wraps the form and renders the error UI for an errored {@link FormHealth}. Defaults to {@link DefaultFormHealthBoundary} (a red banner). */
  formHealthBoundary?: FormHealthBoundary;
  autocomplete?: string;
}

type WidgetComponent = React.ComponentType<WithWidget>;

/**
 * Everything one store initialization produces, kept in one state value so the tree key,
 * the provider value, and the subscriptions can never mix two initializations.
 */
type FormInstance = {
  context: FormContext<WidgetComponent>;
  store: FormContext<WidgetComponent>['store'];
  /** The React key of the widget tree. Every initialization increments it, so the whole
   * tree is destroyed and recreated and every widget subscribes to the store INITIALIZE
   * ran on. */
  generation: number;
  /** The exact prop identities this instance was initialized with, compared by the reinit effect. */
  config: FormInitConfig<WidgetComponent>;
  validators: ValidatorFn<any>;
  subscribe: (onStoreChange: () => void) => () => void;
  getFormLayout: () => LayoutWidget<string>;
  getLang: () => string;
  getHealthError: () => FormHealth | null;
};

function createFormInstance(
  config: FormInitConfig<WidgetComponent>,
  validators: ValidatorFn<any>,
  formName: string,
  generation: number,
): FormInstance {
  const context = new FormContext<WidgetComponent>();
  context.initialize(
    config.widgetLoaders,
    config.middlewares ?? [],
    validators,
    config.validateOn ?? 'eager',
    config.itemRenderers ?? {},
    config.localization,
    config.dependencies ?? {},
    config.functions ?? {},
  );
  // Dispatching during render is safe here: the store was created one line above and has
  // no subscribers yet, so these stay private to this instance. Running init in render
  // (not in an effect) is what gives a server render a populated store.
  const store = context.store;
  store.dispatch({ type: 'INITIALIZE', payload: { formName, formDef: config.formDef } });
  store.dispatch({ type: 'SET_DATA', payload: { data: config.data ?? {} } });
  store.dispatch({ type: 'SET_META', payload: { meta: config.meta ?? {} } });

  // While a derive error is active the reducer allocates a new errored object on every
  // dispatch, so the snapshot returns the cached one while message and code are unchanged.
  let lastHealthError: FormHealth | null = null;

  return {
    context,
    store,
    generation,
    config,
    validators,
    subscribe: (onStoreChange) => {
      const subscription = store.state$.subscribe(onStoreChange);
      return () => subscription.unsubscribe();
    },
    getFormLayout: () => store.getState().formDef.form,
    getLang: () => store.getState().lang,
    getHealthError: () => {
      const health = store.getState().formHealth;
      if (health.status !== 'errored') {
        lastHealthError = null;
        return null;
      }
      const isSameError =
        lastHealthError?.status === 'errored' &&
        lastHealthError.message === health.message &&
        lastHealthError.code === health.code;
      if (!isSameError) {
        lastHealthError = health;
      }
      return lastHealthError;
    },
  };
}

// Effects never run during a server render, and renderToString warns on useLayoutEffect.
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

export const FormComponent = forwardRef<FormComponentHandle, FormComponentProps>(
  function FormComponent(
    { config, validators, formHealth, formEvent, formSubmit, formHealthBoundary, autocomplete },
    ref,
  ) {
    // useId gives the same id on the server and the hydrating client, so an omitted
    // formName still produces matching markup. Computed once at mount and never updated,
    // like every formName.
    const generatedFormName = useId();
    const [formName] = useState(() => config.formName ?? generatedFormName);
    const [instance, setInstance] = useState(() =>
      createFormInstance(config, validators, formName, 0),
    );

    const callbacksRef = useRef({ formHealth, formEvent, formSubmit });
    callbacksRef.current = { formHealth, formEvent, formSubmit };

    const formLayoutField = useSyncExternalStore(
      instance.subscribe,
      instance.getFormLayout,
      instance.getFormLayout,
    );
    const lang = useSyncExternalStore(instance.subscribe, instance.getLang, instance.getLang);
    const healthError = useSyncExternalStore(
      instance.subscribe,
      instance.getHealthError,
      instance.getHealthError,
    );
    const direction = getDirectionFromLanguage(lang);

    // Reinit only when the config or validators object identity changes. The run after the
    // first mount compares the identities the lazy initializer recorded and does nothing.
    // Creation stays outside the setState updater, which has to be pure.
    useEffect(() => {
      if (instance.config === config && instance.validators === validators) {
        return;
      }
      setInstance(createFormInstance(config, validators, formName, instance.generation + 1));
    }, [config, validators, formName, instance]);

    // Layout effect on purpose: the widget tree mounts in the same commit and emits its
    // `load` events from passive effects, which run after every layout effect. A passive
    // subscription here would subscribe too late and lose those events.
    useBrowserLayoutEffect(() => {
      const eventSub = instance.context.events$.subscribe((event) =>
        callbacksRef.current.formEvent?.(event),
      );
      const submitSub = instance.context.submit$.subscribe((event) =>
        callbacksRef.current.formSubmit?.(event),
      );
      const healthSub = watchFormHealth(instance.store.state$).subscribe((health) => {
        if (health.status === 'errored') {
          console.error('GolemUI form failed to initialize:', health.message);
        }
        callbacksRef.current.formHealth?.(health);
      });
      return () => {
        eventSub.unsubscribe();
        submitSub.unsubscribe();
        healthSub.unsubscribe();
      };
    }, [instance]);

    // Browser-only subscription: a language change reaches the render through the store.
    useEffect(() => {
      const unsubscribeI18n = instance.context.localization.subscribe((newLang) => {
        instance.store.dispatch({ type: 'SET_LANGUAGE', payload: { lang: newLang } });
      });
      return () => unsubscribeI18n();
    }, [instance]);

    useImperativeHandle(
      ref,
      () => ({
        setData: (data) => {
          instance.store.dispatch({ type: 'SET_DATA', payload: { data } });
        },
        setMeta: (meta) => {
          instance.store.dispatch({ type: 'SET_META', payload: { meta } });
        },
      }),
      [instance],
    );

    const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      instance.context.emitSubmitEvent();
    };

    // Always render the form inside the boundary so a recovered health clears the error in place.
    const Boundary = formHealthBoundary ?? DefaultFormHealthBoundary;

    return (
      <ReactFormContextProvider formContext={instance.context}>
        <Boundary health={healthError ?? { status: 'ok' }}>
          <div className="gui-form">
            <form
              id={formName}
              noValidate
              dir={direction}
              autoComplete={autocomplete}
              onSubmit={onFormSubmit}
            >
              {formLayoutField && (
                <WidgetErrorBoundary key={instance.generation} widget={formLayoutField}>
                  <WidgetRenderer widget={formLayoutField} />
                </WidgetErrorBoundary>
              )}
            </form>
          </div>
        </Boundary>
      </ReactFormContextProvider>
    );
  },
);

export default FormComponent;
