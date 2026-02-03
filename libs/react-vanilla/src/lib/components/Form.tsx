import * as Core from '@golemui/core';
import * as React from '@golemui/react';
import { ReactItemRenderer } from '@golemui/react';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
} from '@golemui/validators-vanilla';
import { ComponentType } from 'react';
import { vanillaFieldLoaders } from '../field.loaders';

export interface ReactFormComponentProps {
  formDef: string | Record<string, any>;
  fieldLoaders?: Core.WidgetLoaders<ComponentType<Core.WithWidget>>;
  itemRenderers?: Record<string, ReactItemRenderer<any>>;
  localization?: Core.I18nTranslator;
  validators?: CustomValidatorSchemas;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (formHealth: Core.FormHealth) => void;
}

export const FormComponent = ({
  formDef,
  data = undefined,
  fieldLoaders = {},
  itemRenderers = {},
  localization,
  validators = {},
  middlewares = [],
  validateOn = 'eager',
  formHealth = undefined,
  formEvent = undefined,
}: ReactFormComponentProps) => {
  const customFieldLoaders = { ...vanillaFieldLoaders, ...fieldLoaders };
  const customItemRenderers = { ...itemRenderers };
  const customValidators = initValidators({ ...validators });
  const customMiddlewares = [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(jsonSchemaValidators)),
    ...middlewares,
  ];
  return (
    <React.FormComponent
      formDef={formDef}
      data={data}
      fieldLoaders={customFieldLoaders}
      middlewares={customMiddlewares}
      itemRenderers={customItemRenderers}
      localization={localization}
      validators={customValidators}
      validateOn={validateOn}
      formHealth={formHealth}
      formEvent={formEvent}
    />
  );
};
