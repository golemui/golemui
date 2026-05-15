import * as jd from 'ts.data.json';
import { WidgetLoaders } from './context/widget-registry';
import { FormWidget, LayoutWidget, layoutWidgetDecoder } from './form-widget';
import { I18nTranslator } from './i18n';
import { ItemRenderer } from './item-renderer';
import { ReactiveExpression, UiState, ValidateOn } from './shared';
import { Action } from './store/actions';
import { Middleware, State } from './store/model';

// --------------------------------
//
// Types
//
// --------------------------------

export type Form<StateKeys extends UiState = never, FormType extends Record<string, any> = any> = {
  states?: Record<StateKeys, ReactiveExpression>;
  form: LayoutWidget<StateKeys, FormType>;
};

/**
 * Creates a type-safe form definition using TypeScript.
 *
 * Use this helper to enforce strong typing in form structures.
 */
export function defineForm<
  FormType extends Record<string, any> = any,
  States extends Record<string, ReactiveExpression> = Record<string, ReactiveExpression>,
>(config: {
  states?: States;
  form: FormWidget<Extract<keyof States, string>, FormType>[]; // this Extract<> removes number and symbol from the indexed type
}): Form<Extract<keyof States, string>, FormType> {
  return {
    ...config,
    form: {
      uid: '',
      type: 'flex',
      kind: 'layout',
      children: config.form,
    },
  };
}

// --------------------------------
//
// Schema
//
// --------------------------------

export interface FormInitConfig<ComponentType = unknown> {
  formDef: string | Record<string, any>;
  widgetLoaders: WidgetLoaders<ComponentType>;
  formName?: string;
  itemRenderers?: Record<string, ItemRenderer>;
  localization?: I18nTranslator;
  dependencies?: Record<string, unknown>;
  middlewares?: Middleware<State, Action>[];
  validateOn?: ValidateOn;
  data?: Record<string, any>;
  meta?: Record<string, any>;
}

export const formDefDecoder = jd.object(
  {
    states: jd.optional(jd.record(jd.string(), 'states')),
    form: layoutWidgetDecoder,
  },
  'FormDef',
);
