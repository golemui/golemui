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
import {
  type ComponentType,
  type ForwardRefExoticComponent,
  forwardRef,
  type PropsWithoutRef,
  type RefAttributes,
  useCallback,
  useMemo,
} from 'react';
import { FormComponent, type FormComponentHandle } from './FormComponent';
import { type FormHealthBoundary } from './FormHealthBoundary';
import { type WidgetErrorFallback } from './WidgetErrorBoundary';

/**
 * Props of a form component returned by {@link createFormComponent}, generic
 * over the widget set's form config type.
 */
export interface WidgetSetFormProps<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> {
  config: TConfig;
  autocomplete?: string;
  formEvent?: (event: FormEvent) => void;
  formSubmit?: (event: FormSubmitEvent) => void;
  formHealth?: (formHealth: FormHealth) => void;
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary?: FormHealthBoundary;
  /** Replacement UI for a widget that threw. Overrides the `widgetErrorFallback` of the widget set. */
  widgetErrorFallback?: WidgetErrorFallback;
}

/**
 * Defaults a widget set applies to every form it creates. A per-form prop overrides the
 * matching option, except `headless`, which the widget set fixes once because a widget set
 * renders for one host only.
 *
 * @example
 * export const InkForm = createFormComponent<InkFormInitConfig>(inkWidgetSet, {
 *   headless: true,
 *   widgetErrorFallback: (error, widget) => <Text color="red">{widget.type}: {error.message}</Text>,
 * });
 */
export interface CreateFormComponentOptions {
  /** Renders the widget tree without the `div.gui-form` and `form` wrapper. Set it for a host that cannot render DOM elements. */
  headless?: boolean;
  /** Replacement UI for a widget that threw. A per-form `widgetErrorFallback` prop overrides it. */
  widgetErrorFallback?: WidgetErrorFallback;
  /** Wraps every form and renders the error UI for an errored FormHealth. A per-form `formHealthBoundary` prop overrides it. */
  formHealthBoundary?: FormHealthBoundary;
}

/** The component type returned by {@link createFormComponent}. */
export type WidgetSetFormComponent<
  TConfig extends WidgetSetFormInitConfig<any> = WidgetSetFormInitConfig,
> = ForwardRefExoticComponent<
  PropsWithoutRef<WidgetSetFormProps<TConfig>> & RefAttributes<FormComponentHandle>
>;

/**
 * Builds a React form component bound to one widget set.
 *
 * The returned component accepts the widget set's form config, resolves TS
 * builder input through the widget set's `resolveFormInput`, applies the
 * shared merge precedence rules, and renders the core {@link FormComponent}.
 * Widget set packages instantiate this once and export the result (the gui
 * set's `GuiForm` is one example).
 *
 * @param widgetSet - The widget set's loaders, validator factory, and
 * optional form input resolver.
 * @param options - Defaults for every form the widget set creates. A per-form prop wins
 * over the matching option.
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
>(
  widgetSet: WidgetSetDefinition<ComponentType<WithWidget>, TConfig>,
  options?: CreateFormComponentOptions,
): WidgetSetFormComponent<TConfig> {
  return forwardRef<FormComponentHandle, WidgetSetFormProps<TConfig>>(function WidgetSetForm(
    {
      config,
      formHealth,
      formEvent,
      formSubmit,
      formHealthBoundary,
      widgetErrorFallback,
      autocomplete,
    },
    ref,
  ) {
    const { initConfig, validators, resolved } = useMemo(
      () => buildWidgetSetForm(widgetSet, config),
      [config],
    );

    // The bundle is built with untyped loaders. This widget set's loaders
    // resolve to React components, so the config is a React init config.
    const coreConfig = initConfig as FormInitConfig<ComponentType<WithWidget>>;

    // Chain DX-registered event handlers with the user-supplied callback so both fire.
    const mergedFormEvent = useCallback(
      (event: FormEvent) => {
        resolved.formEvent?.(event);
        formEvent?.(event);
      },
      [resolved.formEvent, formEvent],
    );

    return (
      <FormComponent
        ref={ref}
        config={coreConfig}
        validators={validators}
        autocomplete={autocomplete}
        headless={options?.headless}
        formHealth={formHealth}
        formHealthBoundary={formHealthBoundary ?? options?.formHealthBoundary}
        widgetErrorFallback={widgetErrorFallback ?? options?.widgetErrorFallback}
        formEvent={mergedFormEvent}
        formSubmit={formSubmit}
      />
    );
  });
}
