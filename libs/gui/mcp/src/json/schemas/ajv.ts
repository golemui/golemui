import type { ValidateFunction } from 'ajv';
import { formValidator } from './generated/validators.js';

/** Returns the generated validator for the whole form definition. */
export function getFormValidator(): ValidateFunction {
  return formValidator;
}
