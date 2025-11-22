import * as Core from '@golemui/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import * as z from 'zod/mini';
import { LooseObject } from './utils';

// --------------------------------
//
// Types
//
// --------------------------------

interface BaseValidator {
  const?: unknown; // exactly this value or fails.
  enum?: unknown[]; // exactly one of these values or fails.
  required?: boolean; // when required=true, undefined or empty fails.
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

export interface StringValidator extends BaseValidator {
  type: 'string';
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex pattern
  format?: StringFormat;
}

export interface NumberValidator extends BaseValidator {
  type: 'number' | 'integer';
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

export interface BooleanValidator extends BaseValidator {
  type: 'boolean';
}

// TODO: Repeater at some point in the future?
export interface ArrayValidator extends BaseValidator {
  type: 'array';
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: Validator;
}

export type CustomValidator = LooseObject<{
  type: 'custom';
  required?: boolean;
}>;
export type CustomValidatorSchemaFn = (input: any) => StandardSchemaV1;
export type CustomValidatorSchemas = {
  [key: string]: CustomValidatorSchemaFn;
};

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

export const createValidator =
  (customValidators?: CustomValidatorSchemas): Core.ValidatorFn<Validator> =>
  (validator: Validator): StandardSchemaV1 => {
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
        console.warn('TODO: array validator not yet supported');
        return z.success(z.any());

      case 'custom': {
        if (!customValidators) {
          throw new Error(
            'Validator type "custom" requires a customValidators object, but it was not supplied.',
          );
        }
        return fromCustomValidator(validator, customValidators);
      }
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

    if (v.format !== undefined) {
      if (stringFormatKeys.includes(v.format)) {
        schema = schema.check(stringFormat[v.format].schema);
      } else {
        console.error(`The string validation format "${v.format}" is not supported`);
      }
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

function fromBooleanValidator(v: BooleanValidator) {
  return withOptional(v, (v) => {
    let schema = z.boolean();

    if (v.const !== undefined) {
      schema = schema.check(z.refine((val) => val === v.const));
    }

    return schema;
  });
}

function fromCustomValidator(v: CustomValidator, customValidators: CustomValidatorSchemas) {
  return withOptional(v, (v) => {
    let schema = z.any();

    Object.keys(v)
      // filter non-custom validator keys
      .filter((key) => key !== 'type' && key !== 'required')
      .forEach((key) => {
        // This originates from the validator field in the JSON form
        const validatorInput = v[key];
        // This originates from the user-defined custom validators in the form
        const resolvedSchemaFn = customValidators[key];
        const resolvedSchema = resolvedSchemaFn(validatorInput);

        schema = schema.check(
          z.superRefine((val, ctx) => {
            const result = Core.standardValidate(
              resolvedSchema,
              val,
            ) as StandardSchemaV1.Result<unknown>;
            if (!Core.isStandardValidateSuccess(result)) {
              const firstError = result.issues[0];
              ctx.addIssue({
                code: 'custom',
                path: [],
                message: firstError?.message || `Validation failed for ${key}`,
              });
            }
          }),
        );
      });

    return schema;
  });
}

// We need this to isolate the optional schema type from the from*Validator functions
function withOptional<T extends z.ZodMiniType, V extends Validator>(
  validator: V,
  builder: (v: V) => T,
): T | z.ZodMiniOptional<T> {
  const schema = builder(validator);
  if (!validator.required) {
    return z.optional(schema);
  }
  return schema;
}
