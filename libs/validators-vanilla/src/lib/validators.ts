import {
  isStandardValidateSuccess,
  LooseObject,
  standardValidate,
  ValidatorFn,
} from '@golemui/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { iso } from 'zod';
import {
  any,
  boolean,
  email,
  hostname,
  int,
  ipv4,
  ipv6,
  maximum,
  maxLength,
  minimum,
  minLength,
  number,
  optional,
  refine,
  regex,
  string,
  success,
  superRefine,
  url,
  uuid,
  ZodMiniOptional,
  ZodMiniType,
} from 'zod/mini';

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
  email: { schema: email() },
  hostname: { schema: hostname() },
  ipv4: { schema: ipv4() },
  ipv6: { schema: ipv6() },
  url: { schema: url() },
  uuid: { schema: uuid() },
  date: { schema: iso.date() },
  time: { schema: iso.time() },
  'date-time': { schema: iso.datetime() },
  duration: { schema: iso.duration() },
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

export const initValidators =
  (customValidators?: CustomValidatorSchemas): ValidatorFn<Validator> =>
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
        return success(any());

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
    let schema = string();

    if (v.required === true) {
      // TODO: Harcoded error message. Bad for i18n
      schema = schema.check(refine((val) => val.length > 0, { error: 'This field is required' }));
    }

    if (typeof v.minLength === 'number') {
      schema = schema.check(minLength(v.minLength));
    }

    if (typeof v.maxLength === 'number') {
      schema = schema.check(maxLength(v.maxLength));
    }

    if (typeof v.pattern === 'string') {
      schema = schema.check(regex(new RegExp(v.pattern)));
    }

    if (v.enum) {
      const enum_ = v.enum;
      schema = schema.check(refine((val) => enum_.includes(val)));
    }

    if (v.const !== undefined) {
      schema = schema.check(refine((val) => val === v.const));
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
    let schema = number();

    if (v.type === 'integer') {
      schema = schema.check(int());
    }

    if (v.minimum !== undefined) {
      schema = schema.check(minimum(v.minimum));
    }

    if (v.maximum !== undefined) {
      schema = schema.check(maximum(v.maximum));
    }

    if (v.exclusiveMinimum !== undefined) {
      const t = v.exclusiveMinimum;
      schema = schema.check(refine((n) => n > t));
    }

    if (v.exclusiveMaximum !== undefined) {
      const t = v.exclusiveMaximum;
      schema = schema.check(refine((n) => n < t));
    }

    if (v.multipleOf !== undefined) {
      const t = v.multipleOf;
      schema = schema.check(refine((n) => n % t === 0));
    }

    if (v.enum) {
      const enum_ = v.enum;
      schema = schema.check(refine((val) => enum_.includes(val)));
    }

    if (v.const !== undefined) {
      schema = schema.check(refine((val) => val === v.const));
    }

    return schema;
  });
}

function fromBooleanValidator(v: BooleanValidator) {
  return withOptional(v, (v) => {
    let schema = boolean();

    if (v.const !== undefined) {
      schema = schema.check(refine((val) => val === v.const));
    }

    return schema;
  });
}

function fromCustomValidator(v: CustomValidator, customValidators: CustomValidatorSchemas) {
  return withOptional(v, (v) => {
    let schema = any();

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
          superRefine((val, ctx) => {
            const result = standardValidate(
              resolvedSchema,
              val,
            ) as StandardSchemaV1.Result<unknown>;
            if (!isStandardValidateSuccess(result)) {
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
function withOptional<T extends ZodMiniType, V extends Validator>(
  validator: V,
  builder: (v: V) => T,
): T | ZodMiniOptional<T> {
  const schema = builder(validator);
  if (!validator.required) {
    return optional(schema);
  }
  return schema;
}
