import {
  type FormEvent,
  type FormHealth,
  type FormInitConfig,
  type FormSubmitEvent,
  type WithWidget,
} from '@golemui/core';
import {
  buildWidgetSetForm,
  cloneObject,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from '@golemui/core/internals';
import { type Component, computed, defineComponent, h, ref } from 'vue';
import FormComponent from './FormComponent.vue';
import type { FormComponentHandle } from './FormComponent.types';

/**
 * Props of a form component returned by {@link createFormComponent}, generic
 * over the widget set's form config type.
 */
export interface WidgetSetFormProps<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> {
  config: TConfig;
  autocomplete?: string;
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary?: Component;
}

/** Methods exposed on a template ref to a factory-built form component. */
export interface WidgetSetFormHandle {
  /**
   * Returns a copy of the form data, as a form event would carry it now: without the values of
   * hidden inputs.
   */
  getData: () => Record<string, any>;
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
  /** Sets the form health. An errored health shows the boundary and freezes the form until `{ status: 'ok' }`. */
  setHealth: (health: FormHealth) => void;
}

/**
 * The component type returned by {@link createFormComponent}: the widget
 * set's props, the three form events, and the exposed getData / setData / setMeta / setHealth
 * methods.
 */
export type WidgetSetFormComponent<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> = new () => WidgetSetFormHandle & {
  $props: WidgetSetFormProps<TConfig> & {
    'onForm-event'?: (event: FormEvent) => void;
    'onForm-submit'?: (event: FormSubmitEvent) => void;
    'onForm-health'?: (health: FormHealth) => void;
  };
};

/**
 * Builds a Vue form component bound to one widget set.
 *
 * The returned component accepts the widget set's form config, applies the
 * shared merge precedence rules, and renders the core `FormComponent`.
 * Widget set packages instantiate this once and export the result (the gui
 * set's `GuiForm` is one example).
 *
 * @param widgetSet - The widget set's loaders, validator factory and default dependencies.
 *
 * @example
 * export const GuiForm = createFormComponent<GuiFormInitConfig>({
 *   widgetLoaders: guiWidgetLoaders,
 *   validators: initValidators,
 * });
 */
export function createFormComponent<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
>(widgetSet: WidgetSetDefinition<Component<WithWidget>, TConfig>): WidgetSetFormComponent<TConfig> {
  const component = defineComponent({
    name: 'WidgetSetForm',
    // Needed to avoid double 'form-submit' events
    inheritAttrs: false,
    props: ['config', 'autocomplete', 'formHealthBoundary'],
    emits: ['form-event', 'form-submit', 'form-health'],
    setup(props, { emit, expose }) {
      const formRef = ref<FormComponentHandle | null>(null);

      const bundle = computed(() => buildWidgetSetForm(widgetSet, props.config as TConfig));

      expose({
        // The core form starts in the first render, so before it the data is the config data.
        getData: () =>
          formRef.value?.getData() ?? cloneObject((props.config as TConfig).data ?? {}),
        setData: (data: Record<string, any>) => formRef.value?.setData(data),
        setMeta: (meta: Record<string, any>) => formRef.value?.setMeta(meta),
        setHealth: (health: FormHealth) => formRef.value?.setHealth(health),
      } satisfies WidgetSetFormHandle);

      return () =>
        h(FormComponent, {
          ref: formRef,
          // The bundle is built with untyped loaders. This widget set's
          // loaders resolve to Vue components, so the config is a Vue init config.
          config: bundle.value.initConfig as FormInitConfig<Component<WithWidget>>,
          validators: bundle.value.validators,
          autocomplete: props.autocomplete,
          formHealthBoundary: props.formHealthBoundary,
          'onForm-event': (event: FormEvent) => emit('form-event', event),
          'onForm-submit': (event: FormSubmitEvent) => emit('form-submit', event),
          'onForm-health': (health: FormHealth) => emit('form-health', health),
        });
    },
  });

  // The runtime component is authored with untyped props (the array form).
  // This cast is the single place that binds it to the widget set's typed
  // props and the exposed handle.
  return component as unknown as WidgetSetFormComponent<TConfig>;
}
