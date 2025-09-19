import * as z from 'zod/mini';
import { LayoutField, LayoutFieldSchema } from './Field';
import { ReactiveExpression, UiState } from './shared';

// --------------------------------
//
// Types
//
// --------------------------------

export type Form = {
  states?: Record<UiState, ReactiveExpression>;
  form: LayoutField;
};

// --------------------------------
//
// Schema
//
// --------------------------------

export const FormSchema = z.object({
  states: z.optional(z.record(z.string(), z.string())),
  form: LayoutFieldSchema,
});
