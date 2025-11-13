import * as z from 'zod/mini';
import { LayoutField, LayoutFieldSchema } from './form-field';
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
  form: LayoutField<Extract<keyof States, string>>; // this Extract<> removes number and symbol from the indexed type
}) {
  return config;
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
