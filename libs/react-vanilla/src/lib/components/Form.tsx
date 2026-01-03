import * as Core from '@golemui/core';
import * as React from '@golemui/react';
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
  fieldLoaders?: Core.FieldLoaders<ComponentType<Core.WithField>>;
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
  validators = {},
  middlewares = [],
  validateOn = 'eager',
  formHealth = undefined,
  formEvent = undefined,
}: ReactFormComponentProps) => {
  const customFieldLoaders = { ...vanillaFieldLoaders, ...fieldLoaders };
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
      validators={customValidators}
      validateOn={validateOn}
      formHealth={formHealth}
      formEvent={formEvent}
    />
  );
};
