import * as jd from 'ts.data.json';
import { FormWidget, LayoutWidget, layoutWidgetDecoder } from './form-widget';
import { ReactiveExpression, UiState } from './shared';

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

export const formDefDecoder = jd.object(
  {
    states: jd.optional(jd.record(jd.string(), 'states')),
    form: layoutWidgetDecoder,
  },
  'FormDef',
);
