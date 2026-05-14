import * as Core from '@golemui/core';
import { FormInitConfig } from '@golemui/core';
import { GuiFormInitConfig, resolveFormInput } from '@golemui/gui-shared';
import { initValidators } from '@golemui/gui-validators';
import * as React from '@golemui/react';
import { ReactItemRenderer } from '@golemui/react';
import { ComponentType, useMemo } from 'react';
import { widgetLoaders as golemWidgetLoaders } from '../widget.loaders';

export interface ReactFormComponentProps {
  config: GuiFormInitConfig;
  autocomplete?: string;
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (formHealth: Core.FormHealth) => void;
}

export const GuiForm = ({
  config,
  formHealth = undefined,
  formEvent = undefined,
  autocomplete,
}: ReactFormComponentProps) => {
  const resolved = useMemo(
    () => resolveFormInput(config.formDef, config.formSelectors, config.formConfig),
    [config],
  );

  const coreConfig: FormInitConfig<ComponentType<Core.WithWidget>> = {
    formDef: resolved.formDef as string | Record<string, any>,
    widgetLoaders: {
      ...golemWidgetLoaders,
      ...(resolved.widgetLoaders as Core.WidgetLoaders<ComponentType<Core.WithWidget>>),
      ...((config.customWidgetLoaders ?? {}) as Core.WidgetLoaders<ComponentType<Core.WithWidget>>),
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
      ? (event: Core.FormEvent) => {
          resolved.formEvent!(event);
          formEvent(event);
        }
      : (formEvent ?? resolved.formEvent);

  return (
    <React.FormComponent
      config={coreConfig}
      validators={allValidators}
      autocomplete={autocomplete}
      formHealth={formHealth}
      formEvent={mergedFormEvent}
    />
  );
};
