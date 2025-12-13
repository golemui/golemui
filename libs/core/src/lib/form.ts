import * as jd from 'ts.data.json';
import { FormField, LayoutField, layoutFieldDecoder } from './form-field';
import { ReactiveExpression, ReactiveFieldFunction, UiState } from './shared';

// --------------------------------
//
// Types
//
// --------------------------------

export type Form<StateKeys extends UiState = never> = {
  // TODO: what is this for??
  functions?: Record<StateKeys, ReactiveFieldFunction<any>>;
  states?: Record<StateKeys, ReactiveExpression>;
  form: LayoutField<StateKeys>;
};

/**
 * Creates a type-safe form definition using TypeScript.
 *
 * Use this helper to enforce strong typing in form structures.
 */
export function defineForm<States extends Record<string, ReactiveExpression>>(config: {
  states?: States;
  form: FormField<Extract<keyof States, string>>[]; // this Extract<> removes number and symbol from the indexed type
}): Form<Extract<keyof States, string>> {
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
