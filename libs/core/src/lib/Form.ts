import * as z from 'zod/mini';
import { LayoutField, LayoutFieldSchema } from './Field';
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
export function defineForm<
  States extends Record<string, ReactiveExpression>
>(config: {
  states?: States;
  form: LayoutField<Extract<keyof States, string>>;
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
