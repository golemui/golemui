import * as z from 'zod/mini';
import { LooseObject } from './utils/types';

// --------------------------------
//
// Types
//
// --------------------------------

interface BaseValidator {
  const?: unknown; // exactly this value or fails.
  enum?: unknown[]; // exactly one of these values or fails.
  required?: boolean; // when required=true, undefined or empty fails.
  requiredJsonSchema?: boolean; // Use strictly the JSON schema semantics. When required undefined fails, but empty doesn't.
}

const stringFormat = {
  email: { schema: z.email() },
  hostname: { schema: z.hostname() },
  ipv4: { schema: z.ipv4() },
  ipv6: { schema: z.ipv6() },
  url: { schema: z.url() },
  uuid: { schema: z.uuid() },
  date: { schema: z.iso.date() },
  time: { schema: z.iso.time() },
  'date-time': { schema: z.iso.datetime() },
  duration: { schema: z.iso.duration() },
};

type StringFormat = keyof typeof stringFormat;
const stringFormatKeys = Object.keys(stringFormat) as StringFormat[];

interface StringValidator extends BaseValidator {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex pattern
  format?: StringFormat;
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

export const createValidator = (validator: Validator): z.ZodMiniType => {
  switch (validator.type) {
    case 'string':
      return fromStringValidator(validator);

    case 'integer':
    case 'number':
      return fromNumberValidator(validator);

    case 'boolean':
      return fromBooleanValidator(validator);

    case 'array':
      // TODO: implement
      console.warn('TODO');
      return z.success(z.any());
    case 'custom':
      // TODO: implement
      console.warn('TODO');
      return z.success(z.any());
  }
};

function fromStringValidator(v: StringValidator) {
  return withOptional(v, (v) => {
    let schema = z.string();

    if (typeof v.minLength === 'number') {
      schema = schema.check(z.minLength(v.minLength));
    }

    if (typeof v.maxLength === 'number') {
      schema = schema.check(z.maxLength(v.maxLength));
    }

    if (typeof v.pattern === 'string') {
      schema = schema.check(z.regex(new RegExp(v.pattern)));
    }

    if (v.enum) {
      const enum_ = v.enum;
      schema = schema.check(z.refine((val) => enum_.includes(val)));
    }

    if (v.const !== undefined) {
      schema = schema.check(z.refine((val) => val === v.const));
    }

    if (v.format !== undefined && stringFormatKeys.includes(v.format)) {
      schema = schema.check(stringFormat[v.format].schema);
    }

    return schema;
  });
}

function fromNumberValidator(v: NumberValidator) {
  return withOptional(v, (v) => {
    let schema = z.number();

    if (v.type === 'integer') {
      schema = schema.check(z.int());
    }

    if (v.minimum !== undefined) {
      schema = schema.check(z.minimum(v.minimum));
    }

    if (v.maximum !== undefined) {
      schema = schema.check(z.maximum(v.maximum));
    }

    if (v.exclusiveMinimum !== undefined) {
      const t = v.exclusiveMinimum;
      schema = schema.check(z.refine((n) => n > t));
    }

    if (v.exclusiveMaximum !== undefined) {
      const t = v.exclusiveMaximum;
      schema = schema.check(z.refine((n) => n > t));
    }

    if (v.multipleOf !== undefined) {
      const t = v.multipleOf;
      schema = schema.check(z.refine((n) => n % t === 0));
    }

    if (v.enum) {
      const enum_ = v.enum;
      schema = schema.check(z.refine((val) => enum_.includes(val)));
    }

    if (v.const !== undefined) {
      schema = schema.check(z.refine((val) => val === v.const));
    }

    return schema;
  });
}

export function fromBooleanValidator(v: BooleanValidator) {
  return withOptional(v, (v) => {
    let schema = z.boolean();

    if (v.const !== undefined) {
      schema = schema.check(z.refine((val) => val === v.const));
    }

    return schema;
  });
}

// We need this to isolate the optional schema type from the from*Validator functions
function withOptional<T extends z.ZodMiniType, V extends Validator>(
  validator: V,
  builder: (v: V) => T,
): T | z.ZodMiniOptional<T> {
  const schema = builder(validator);
  if (!validator.required && !validator.requiredJsonSchema) {
    return z.optional(schema);
  }
  return schema;
}
