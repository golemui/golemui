import * as Core from '@golemui/core';
import {
  Dependencies,
  DxFormConfig,
  FormInput,
  GslSelectorsInput,
  resolveFormInput,
} from '@golemui/gui-shared';
import { CustomValidatorSchemas, initValidators } from '@golemui/gui-validators';
import * as React from '@golemui/react';
import { ReactItemRenderer } from '@golemui/react';
import { ComponentType, useMemo } from 'react';
import { widgetLoaders as golemWidgetLoaders } from '../widget.loaders';

export interface ReactFormComponentProps {
  formDef: FormInput;
  formSelectors?: GslSelectorsInput;
  formConfig?: DxFormConfig;
  customWidgetLoaders?: Core.WidgetLoaders<ComponentType<Core.WithWidget>>;
  itemRenderers?: Record<string, ReactItemRenderer<any>>;
  localization?: Core.I18nTranslator;
  dependencies?: Dependencies;
  customValidators?: CustomValidatorSchemas;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  formName?: string;
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (formHealth: Core.FormHealth) => void;
  autocomplete?: string;
}

export const FormComponent = ({
  formDef,
  formSelectors,
  formConfig,
  data = undefined,
  meta = undefined,
  customWidgetLoaders = {},
  itemRenderers = {},
  localization,
  dependencies,
  customValidators = {},
  middlewares = [],
  validateOn,
  formHealth = undefined,
  formEvent = undefined,
  autocomplete,
}: ReactFormComponentProps) => {
  const resolved = useMemo(
    () => resolveFormInput(formDef, formSelectors, formConfig),
    [formDef, formSelectors, formConfig],
  );

  const allWidgetLoaders = {
    ...golemWidgetLoaders,
    ...(resolved.widgetLoaders as Core.WidgetLoaders<ComponentType<Core.WithWidget>>),
    ...customWidgetLoaders,
  };
  const allValidators = initValidators({ ...customValidators });
  const mergedDependencies = {
    ...(resolved.dependencies ?? {}),
    ...(dependencies ?? {}),
  };
  const mergedValidateOn = validateOn ?? resolved.validateOn ?? 'eager';
  // Chain DX-registered fn handlers with the user-supplied callback so both fire:
  // - resolved.formEvent dispatches handlers registered by the DX pipeline
  // - formEvent (user) handles widget events whose names map to handlers in app code
  const mergedFormEvent =
    resolved.formEvent && formEvent
      ? (event: Core.FormEvent) => {
          resolved.formEvent!(event);
          formEvent(event);
        }
      : (formEvent ?? resolved.formEvent);
  const mergedItemRenderers = {
    ...((resolved.itemRenderers ?? {}) as Record<string, ReactItemRenderer<any>>),
    ...itemRenderers,
  };

  return (
    <React.FormComponent
      formDef={resolved.formDef as string | Record<string, any>}
      data={data}
      meta={meta}
      widgetLoaders={allWidgetLoaders}
      middlewares={middlewares}
      itemRenderers={mergedItemRenderers}
      localization={localization}
      dependencies={mergedDependencies}
      validators={allValidators}
      validateOn={mergedValidateOn}
      formHealth={formHealth}
      formEvent={mergedFormEvent}
      autocomplete={autocomplete}
    />
  );
};
