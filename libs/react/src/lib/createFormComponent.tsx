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
): WidgetSetFormComponent<TConfig> {
  return forwardRef<FormComponentHandle, WidgetSetFormProps<TConfig>>(function WidgetSetForm(
    { config, formHealth, formEvent, formSubmit, formHealthBoundary, autocomplete },
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
        formHealth={formHealth}
        formHealthBoundary={formHealthBoundary}
        formEvent={mergedFormEvent}
        formSubmit={formSubmit}
      />
    );
  });
}
