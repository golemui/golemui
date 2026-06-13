import type { JsonSchemaLike } from './json-schema-to-gui';

export type StringValidator = {
  type: 'string';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  const?: unknown;
  enum?: unknown[];
};
export type NumberValidator = {
  type: 'number' | 'integer';
  required?: boolean;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
};
export type BooleanValidator = {
  type: 'boolean';
  required?: boolean;
  const?: unknown;
};

export type Validator = StringValidator | NumberValidator | BooleanValidator;

const SUPPORTED_STRING_FORMATS = new Set([
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'url',
  'uuid',
  'date',
  'time',
  'date-time',
  'duration',
]);

export function buildStringValidator(
  s: JsonSchemaLike,
  required: boolean,
): StringValidator | undefined {
  const v: StringValidator = { type: 'string' };
  let used = false;
  if (required) {
    v.required = true;
    used = true;
  }
  if (typeof s.minLength === 'number') {
    v.minLength = s.minLength;
    used = true;
  }
  if (typeof s.maxLength === 'number') {
    v.maxLength = s.maxLength;
    used = true;
  }
  if (typeof s.pattern === 'string') {
    v.pattern = s.pattern;
    used = true;
  }
  if (typeof s.format === 'string' && SUPPORTED_STRING_FORMATS.has(s.format)) {
    // GolemUI handles date/date-time with specialized widgets; only add `format` for the others.
    if (s.format !== 'date' && s.format !== 'date-time') {
      v.format = s.format;
      used = true;
    }
  }
  if (s.const !== undefined) {
    v.const = s.const;
    used = true;
  }
  if (Array.isArray(s.enum)) {
    v.enum = s.enum;
    used = true;
  }
  return used ? v : undefined;
}

export function buildNumberValidator(
  s: JsonSchemaLike,
  required: boolean,
  t: 'number' | 'integer',
): NumberValidator | undefined {
  const v: NumberValidator = { type: t };
  let used = false;
  if (required) {
    v.required = true;
    used = true;
  }
  if (typeof s.minimum === 'number') {
    v.minimum = s.minimum;
    used = true;
  }
  if (typeof s.maximum === 'number') {
    v.maximum = s.maximum;
    used = true;
  }
  if (typeof s.exclusiveMinimum === 'number') {
    v.exclusiveMinimum = s.exclusiveMinimum;
    used = true;
  }
  if (typeof s.exclusiveMaximum === 'number') {
    v.exclusiveMaximum = s.exclusiveMaximum;
    used = true;
  }
  if (typeof s.multipleOf === 'number') {
    v.multipleOf = s.multipleOf;
    used = true;
  }
  return used ? v : undefined;
}

export function buildBooleanValidator(
  s: JsonSchemaLike,
  required: boolean,
): BooleanValidator | undefined {
  const v: BooleanValidator = { type: 'boolean' };
  let used = false;
  if (required) {
    v.required = true;
    used = true;
  }
  if (s.const !== undefined) {
    v.const = s.const;
    used = true;
  }
  return used ? v : undefined;
}
