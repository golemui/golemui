import * as jd from 'ts.data.json';
import { FormField, LayoutField, layoutFieldDecoder } from './form-field';
import { ReactiveExpression, UiState } from './shared';

// --------------------------------
//
// Types
//
// --------------------------------

export type Form<StateKeys extends UiState = never, FormData extends Record<string, any> = any> = {
  states?: Record<StateKeys, ReactiveExpression>;
  form: LayoutField<StateKeys, FormData>;
};

/**
 * Creates a type-safe form definition using TypeScript.
 *
 * Use this helper to enforce strong typing in form structures.
 */
export function defineForm<
  FormData extends Record<string, any> = any,
  States extends Record<string, ReactiveExpression> = Record<string, ReactiveExpression>,
>(config: {
  states?: States;
  form: FormField<Extract<keyof States, string>, FormData>[]; // this Extract<> removes number and symbol from the indexed type
}): Form<Extract<keyof States, string>, FormData> {
  return {
    ...config,
    form: {
      uid: '',
      widget: 'stack',
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
    form: layoutFieldDecoder,
  },
  'FormDef',
);
