import { lazy, object, optional, record, string } from 'ts.data.json';
import { type WidgetLoaders } from './context/widget-registry';
import { type FormWidget, type LayoutWidget, layoutWidgetDecoder } from './form-widget';
import { type I18nTranslator } from './i18n';
import { type ItemRenderer } from './item-renderer';
import {
  type ExpressionFunctions,
  type ReactiveExpression,
  type UiState,
  type ValidateOn,
} from './shared';
import { type FormPlugin } from './plugin';
import { type Action } from './store/actions';
import { type Middleware, type State } from './store/model';
import { assignDeterministicUids } from './utils/deterministic-uids';
import { type ValueSchemaResolver } from './value-schema';

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
  /**
   * Pure functions callable from reactive expressions under the `$fn` namespace,
   * e.g. `"text": "Total: {{ $fn.grandTotal($form.lineItems) }}"`.
   *
   * Available in every expression context: `{{...}}` string interpolation, i18n params,
   * `when` expressions (include/exclude/disabled/readonly) and state expressions.
   */
  functions?: ExpressionFunctions;
  middlewares?: Middleware<State, Action>[];
  validateOn?: ValidateOn;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  /**
   * Runtime extensions of this form. Each plugin is attached once the form is live on the
   * client (after `INITIALIZE`, `SET_DATA` and `SET_META` ran), receives a
   * {@link FormPluginContext}, and is detached when the form is torn down or re-initialized.
   * Never attached during a server render. `@golemui/webmcp` is one implementation.
   */
  plugins?: FormPlugin[];
  /**
   * The widget set's description of the values its input widgets hold (JSON Schema fragments,
   * choices, writability). The core never reads it: it is routed to the plugins that describe
   * the form to the outside. Widget set packages supply it through their form component
   * factory, so a form author normally never sets it.
   */
  valueSchemas?: ValueSchemaResolver;
}

export const formDefDecoder = object({
  states: optional(record(string())),
  form: lazy(() => layoutWidgetDecoder),
}).map((formDef) => {
  assignDeterministicUids(formDef.form);
  return formDef;
});
