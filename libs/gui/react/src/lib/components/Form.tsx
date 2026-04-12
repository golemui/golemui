import * as Core from '@golemui/core';
import { Dependencies } from '@golemui/gui-shared';
import { CustomValidatorSchemas, initValidators } from '@golemui/gui-validators';
import * as React from '@golemui/react';
import { ReactItemRenderer } from '@golemui/react';
import { ComponentType } from 'react';
import { widgetLoaders as golemWidgetLoaders } from '../widget.loaders';

export interface ReactFormComponentProps {
  formDef: string | Record<string, any>;
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
  data = undefined,
  meta = undefined,
  customWidgetLoaders = {},
  itemRenderers = {},
  localization,
  dependencies = {},
  customValidators = {},
  middlewares = [],
  validateOn = 'eager',
  formHealth = undefined,
  formEvent = undefined,
  autocomplete,
}: ReactFormComponentProps) => {
  const allWidgetLoaders = { ...golemWidgetLoaders, ...customWidgetLoaders };
  const customItemRenderers = { ...itemRenderers };
  const allValidators = initValidators({ ...customValidators });
  return (
    <React.FormComponent
      formDef={formDef}
      data={data}
      meta={meta}
      widgetLoaders={allWidgetLoaders}
      middlewares={middlewares}
      itemRenderers={customItemRenderers}
      localization={localization}
      dependencies={dependencies}
      validators={allValidators}
      validateOn={validateOn}
      formHealth={formHealth}
      formEvent={formEvent}
      autocomplete={autocomplete}
    />
  );
};
