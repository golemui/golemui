import * as Core from '@golemui/core';
import * as React from '@golemui/react';
import { ReactItemRenderer } from '@golemui/react';
import { Dependencies, vanillaSchemaToFieldMap } from '@golemui/gui-shared';
import {
  CustomValidatorSchemas,
  initValidators,
  jsonSchemaValidators,
} from '@golemui/gui-validators';
import { ComponentType } from 'react';
import { vanillaWidgetLoaders } from '../widget.loaders';

export interface ReactFormComponentProps {
  formDef: string | Record<string, any>;
  // TODO: this should be customWidgetLoaders
  widgetLoaders?: Core.WidgetLoaders<ComponentType<Core.WithWidget>>;
  itemRenderers?: Record<string, ReactItemRenderer<any>>;
  localization?: Core.I18nTranslator;
  locale?: string;
  dependencies?: Dependencies;
  validators?: CustomValidatorSchemas;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: Core.ValidateOn;
  data?: Record<string, any>;
  formName?: string;
  direction?: 'ltr' | 'rtl';
  formEvent?: (event: Core.FormEvent) => void;
  formHealth?: (formHealth: Core.FormHealth) => void;
}

export const FormComponent = ({
  formDef,
  data = undefined,
  widgetLoaders = {},
  itemRenderers = {},
  localization,
  locale,
  dependencies = {},
  validators = {},
  middlewares = [],
  validateOn = 'eager',
  direction,
  formHealth = undefined,
  formEvent = undefined,
}: ReactFormComponentProps) => {
  // TODO: this should be customWidgetLoaders
  const customWidgetLoaders = { ...vanillaWidgetLoaders, ...widgetLoaders };
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
      widgetLoaders={customWidgetLoaders}
      middlewares={customMiddlewares}
      itemRenderers={customItemRenderers}
      localization={localization}
      locale={locale}
      dependencies={dependencies}
      validators={customValidators}
      validateOn={validateOn}
      direction={direction}
      formHealth={formHealth}
      formEvent={formEvent}
    />
  );
};
