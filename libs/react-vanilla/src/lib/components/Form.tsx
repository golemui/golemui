import * as Core from '@golemui/core';
import { vanillaSchemaToFieldMap } from '@golemui/shared-vanilla';
import * as React from '@golemui/react';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
} from '@golemui/validators-vanilla';
import { vanillaFieldLoaders } from '../field.loaders';
import { ComponentType } from 'react';

export interface ReactFormComponentProps {
  formDef: string | Record<string, any>;
  fieldLoader?: Core.FieldLoaders<ComponentType<Core.WithField>>;
  validators?: CustomValidatorSchemas;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  formEvent?: (event: Core.FormEvent) => void;
  formError?: (error: Core.FormStoreError) => void;
}

export const FormComponent = ({
  formDef,
  data = undefined,
  fieldLoader = {},
  validators = {},
  middlewares = [],
  validateOn = 'eager',
  formError = undefined,
  formEvent = undefined,
}: ReactFormComponentProps) => {
  const customFieldLoaders = { ...vanillaFieldLoaders, ...fieldLoader };
  const customValidators = initValidators({ ...validators });
  const customMiddlewares = [
    Core.jsonSchemaMiddleware(vanillaSchemaToFieldMap(jsonSchemaValidators)),
    ...middlewares,
  ];
  return (
    <React.FormComponent
      formDef={formDef}
      data={data}
      fieldLoader={customFieldLoaders}
      middlewares={customMiddlewares}
      validators={customValidators}
      validateOn={validateOn}
      formError={formError}
      formEvent={formEvent}
    />
  );
};
