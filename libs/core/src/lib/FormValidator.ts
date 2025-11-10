import { LooseObject } from './utils/types';

// --------------------------------
//
// Types
//
// --------------------------------

interface BaseValidator {
  const?: unknown; // exactly this value or fails.
  enum?: unknown[]; // exactly one of these values or fails.
  required: boolean; // when required=true, undefined or empty fails.
  requiredJsonSchema: boolean; // Use strictly the JSON schema semantics. When required undefined fails, but empty doesn't.
}

interface StringValidator extends BaseValidator {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex pattern
  format?: string; // JSON Schema formats such as 'email', 'url', 'date', 'datetime', etc..
}

interface NumberValidator extends BaseValidator {
  type: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

interface BooleanValidator extends BaseValidator {
  type: 'boolean';
}

// TODO: Repeater at some point in the future?
interface ArrayValidator extends BaseValidator {
  type: 'array';
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: Validator;
}

type CustomValidator = LooseObject<{
  type: 'custom';
  [k: string]: any;
}>;

// --- Union of all supported types ---
export type Validator =
  | StringValidator
  | NumberValidator
  | BooleanValidator
  | ArrayValidator
  | CustomValidator;

// --------------------------------
//
// Schema
//
// --------------------------------
