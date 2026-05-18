import { lazy, object, optional, record, string } from 'ts.data.json';
import { type WidgetLoaders } from './context/widget-registry';
import { type FormWidget, type LayoutWidget, layoutWidgetDecoder } from './form-widget';
import { type I18nTranslator } from './i18n';
import { type ItemRenderer } from './item-renderer';
import { type ReactiveExpression, type UiState, type ValidateOn } from './shared';
import { type Action } from './store/actions';
import { type Middleware, type State } from './store/model';

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

export const formDefDecoder = object(
  {
    states: optional(record(string(), 'states')),
    form: lazy(() => layoutWidgetDecoder),
  },
  'FormDef',
);
