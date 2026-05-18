import type { FormEvent, FormHealth, WidgetLoaders, WithWidget } from '@golemui/core';
import { type FormInitConfig } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import { FormComponent, type FormComponentHandle, type ReactItemRenderer } from '@golemui/react';
import { type ComponentType, type Ref, useMemo } from 'react';
import { widgetLoaders as golemWidgetLoaders } from '../widget.loaders';

export interface ReactFormComponentProps {
  config: GuiFormInitConfig;
  autocomplete?: string;
  formEvent?: (event: FormEvent) => void;
  formHealth?: (formHealth: FormHealth) => void;
  ref?: Ref<FormComponentHandle>;
}

export function GuiForm({
  config,
  formHealth = undefined,
  formEvent = undefined,
  autocomplete,
  ref,
}: ReactFormComponentProps) {
  const resolved = useMemo(
    () => resolveFormInput(config.formDef, config.formSelectors, config.formConfig),
    [config],
  );

  const coreConfig: FormInitConfig<ComponentType<WithWidget>> = {
    formDef: resolved.formDef as string | Record<string, any>,
    widgetLoaders: {
      ...golemWidgetLoaders,
      ...(resolved.widgetLoaders as WidgetLoaders<ComponentType<WithWidget>>),
      ...((config.customWidgetLoaders ?? {}) as WidgetLoaders<ComponentType<WithWidget>>),
    },
    dependencies: { ...(resolved.dependencies ?? {}), ...(config.dependencies ?? {}) },
    validateOn: config.validateOn ?? resolved.validateOn ?? 'eager',
    itemRenderers: {
      ...((resolved.itemRenderers ?? {}) as Record<string, ReactItemRenderer<any>>),
      ...((config.itemRenderers ?? {}) as Record<string, ReactItemRenderer<any>>),
    },
    localization: config.localization,
    middlewares: config.middlewares ?? [],
    data: config.data,
    meta: config.meta,
    formName: config.formName,
  };

  const allValidators = initValidators({ ...(config.customValidators ?? {}) });

  // Chain DX-registered event handlers with the user-supplied callback so both fire.
  const mergedFormEvent =
    resolved.formEvent && formEvent
      ? (event: FormEvent) => {
          resolved.formEvent?.(event);
          formEvent(event);
        }
      : (formEvent ?? resolved.formEvent);

  return (
    <FormComponent
      ref={ref}
      config={coreConfig}
      validators={allValidators}
      autocomplete={autocomplete}
      formHealth={formHealth}
      formEvent={mergedFormEvent}
    />
  );
}
