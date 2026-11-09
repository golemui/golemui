// Types for the generated `testing/form-validator.js`, the whole-form validator. Only the
// differential test imports it; no entry of the package does.
import type { ValidateFunction } from 'ajv';

/** Reports every error. */
export declare const formValidator: ValidateFunction;
/** Stops at the first error. Much faster on deeply nested forms. */
export declare const formValidatorFirstError: ValidateFunction;
