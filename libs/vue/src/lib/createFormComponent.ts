import type {
  FormEvent,
  FormHealth,
  FormInitConfig,
  FormSubmitEvent,
  WithWidget,
} from '@golemui/core';
import {
  buildWidgetSetForm,
  type WidgetSetDefinition,
  type WidgetSetFormInitConfig,
} from '@golemui/dx';
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
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}

/**
 * The component type returned by {@link createFormComponent}: the widget
 * set's props, the three form events, and the exposed setData / setMeta
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
 * The returned component accepts the widget set's form config, resolves TS
 * builder input through the widget set's `resolveFormInput`, applies the
 * shared merge precedence rules, and renders the core `FormComponent`.
 * Widget set packages instantiate this once and export the result (the gui
 * set's `GuiForm` is one example).
 *
 * @param widgetSet - The widget set's loaders, validator factory, and
 * optional form input resolver.
 *
 * @example
 * export const GuiForm = createFormComponent<GuiFormInitConfig>({
 *   widgetLoaders: guiWidgetLoaders,
 *   validators: initValidators,
 *   resolveFormInput,
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
        setData: (data: Record<string, any>) => formRef.value?.setData(data),
        setMeta: (meta: Record<string, any>) => formRef.value?.setMeta(meta),
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
          // Chain DX-registered event handlers with the user-supplied listener so both fire.
          'onForm-event': (event: FormEvent) => {
            bundle.value.resolved.formEvent?.(event);
            emit('form-event', event);
          },
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
