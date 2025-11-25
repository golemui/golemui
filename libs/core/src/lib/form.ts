import * as z from 'zod/mini';
import { FormField, LayoutField, LayoutFieldSchema } from './form-field';
import { ReactiveExpression, UiState } from './shared';

// --------------------------------
//
// Types
//
// --------------------------------

export type Form<StateKeys extends UiState = never> = {
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

export const FormSchema = z.object({
  states: z.optional(z.record(z.string(), z.string())),
  form: LayoutFieldSchema,
});
