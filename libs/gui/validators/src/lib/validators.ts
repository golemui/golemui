import {
  I18nTranslator,
  isStandardValidateSuccess,
  Localizable,
  standardValidate,
  ValidatorFn,
} from '@golemui/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { iso } from 'zod';
import {
  any,
  array,
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
  messages?: Record<string, Localizable>; // per-rule custom error messages.
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

export interface ArrayValidator extends BaseValidator {
  type: 'array';
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  items?: Validator;
}

export interface CustomValidator {
  type: 'custom';
  required?: boolean;
  [key: string]: unknown;
}
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
  (validator: Validator, localization?: I18nTranslator): StandardSchemaV1 => {
    switch (validator.type) {
      case 'string':
        return fromStringValidator(validator, localization);

      case 'integer':
      case 'number':
        return fromNumberValidator(validator, localization);

      case 'boolean':
        return fromBooleanValidator(validator, localization);

      case 'array':
        return fromArrayValidator(validator, localization);

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

function resolveMessage(
  message: Localizable | undefined,
  localization: I18nTranslator | undefined,
): string | undefined {
  if (message === undefined) {
    return undefined;
  }
  if (typeof message === 'string') {
    return message;
  }
  return localization?.translate(message.key, message.params, message.default) ?? message.default;
}

function fromStringValidator(v: StringValidator, localization?: I18nTranslator) {
  return withOptional(v, (v) => {
    const invalidMsg = resolveMessage(v.messages?.['invalid'], localization);
    let schema = invalidMsg ? string(invalidMsg) : string();

    if (v.required === true) {
      const msg =
        resolveMessage(v.messages?.['required'], localization) ?? 'This field is required';
      schema = schema.check(refine((val) => val.length > 0, { error: msg }));
    }

    if (typeof v.minLength === 'number') {
      const msg = resolveMessage(v.messages?.['minLength'], localization);
      const threshold = v.minLength;
      schema = schema.check(
        msg
          ? refine((val) => (val as string).length >= threshold, { error: msg })
          : minLength(threshold),
      );
    }

    if (typeof v.maxLength === 'number') {
      const msg = resolveMessage(v.messages?.['maxLength'], localization);
      const threshold = v.maxLength;
      schema = schema.check(
        msg
          ? refine((val) => (val as string).length <= threshold, { error: msg })
          : maxLength(threshold),
      );
    }

    if (typeof v.pattern === 'string') {
      const msg = resolveMessage(v.messages?.['pattern'], localization);
      const re = new RegExp(v.pattern);
      schema = schema.check(
        msg ? refine((val) => re.test(val as string), { error: msg }) : regex(re),
      );
    }

    if (v.enum) {
      const enum_ = v.enum;
      const msg = resolveMessage(v.messages?.['enum'], localization);
      schema = schema.check(refine((val) => enum_.includes(val), msg ? { error: msg } : undefined));
    }

    if (v.const !== undefined) {
      const msg = resolveMessage(v.messages?.['const'], localization);
      schema = schema.check(refine((val) => val === v.const, msg ? { error: msg } : undefined));
    }

    if (v.format !== undefined) {
      if (stringFormatKeys.includes(v.format)) {
        const msg = resolveMessage(v.messages?.['format'], localization);
        schema = schema.check(
          msg
            ? superRefine((val, ctx) => {
                // TODO: fix this `as unknown as StandardSchemaV1.Result<unknown>` typing
                const result = standardValidate(
                  stringFormat[v.format!].schema,
                  val,
                ) as unknown as StandardSchemaV1.Result<unknown>;
                if (!isStandardValidateSuccess(result)) {
                  ctx.addIssue({ code: 'custom', path: [], message: msg });
                }
              })
            : stringFormat[v.format].schema,
        );
      } else {
        console.error(`The string validation format "${v.format}" is not supported`);
      }
    }

    return schema;
  });
}

/**
 * JavaScript uses IEEE 754 floats.
 * Simple modulo (%) is unreliable for non-integers.
 */
const isSafeMultipleOf = (n: number, step: number): boolean => {
  if (step === 0) {
    return false;
  }
  const division = n / step;
  return Math.abs(division - Math.round(division)) < 1e-10;
};

function fromNumberValidator(v: NumberValidator, localization?: I18nTranslator) {
  return withOptional(v, (v) => {
    const invalidMsg = resolveMessage(v.messages?.['invalid'], localization);
    let schema = invalidMsg ? number(invalidMsg) : number();

    if (v.type === 'integer') {
      schema = schema.check(int());
    }

    if (v.minimum !== undefined) {
      const msg = resolveMessage(v.messages?.['minimum'], localization);
      const t = v.minimum;
      schema = schema.check(msg ? refine((n) => n >= t, { error: msg }) : minimum(t));
    }

    if (v.maximum !== undefined) {
      const msg = resolveMessage(v.messages?.['maximum'], localization);
      const t = v.maximum;
      schema = schema.check(msg ? refine((n) => n <= t, { error: msg }) : maximum(t));
    }

    if (v.exclusiveMinimum !== undefined) {
      const msg = resolveMessage(v.messages?.['exclusiveMinimum'], localization);
      const t = v.exclusiveMinimum;
      schema = schema.check(refine((n) => n > t, msg ? { error: msg } : undefined));
    }

    if (v.exclusiveMaximum !== undefined) {
      const msg = resolveMessage(v.messages?.['exclusiveMaximum'], localization);
      const t = v.exclusiveMaximum;
      schema = schema.check(refine((n) => n < t, msg ? { error: msg } : undefined));
    }

    if (v.multipleOf !== undefined) {
      const msg = resolveMessage(v.messages?.['multipleOf'], localization);
      const t = v.multipleOf;
      schema = schema.check(
        refine((n) => isSafeMultipleOf(n, t), msg ? { error: msg } : undefined),
      );
    }

    if (v.enum) {
      const enum_ = v.enum;
      const msg = resolveMessage(v.messages?.['enum'], localization);
      schema = schema.check(refine((val) => enum_.includes(val), msg ? { error: msg } : undefined));
    }

    if (v.const !== undefined) {
      const msg = resolveMessage(v.messages?.['const'], localization);
      schema = schema.check(refine((val) => val === v.const, msg ? { error: msg } : undefined));
    }

    return schema;
  });
}

function fromBooleanValidator(v: BooleanValidator, localization?: I18nTranslator) {
  return withOptional(v, (v) => {
    const invalidMsg = resolveMessage(v.messages?.['invalid'], localization);
    let schema = invalidMsg ? boolean(invalidMsg) : boolean();

    if (v.const !== undefined) {
      const msg = resolveMessage(v.messages?.['const'], localization);
      schema = schema.check(refine((val) => val === v.const, msg ? { error: msg } : undefined));
    }

    return schema;
  });
}

function fromArrayValidator(v: ArrayValidator, localization?: I18nTranslator) {
  return withOptional(v, (v) => {
    const invalidMsg = resolveMessage(v.messages?.['invalid'], localization);
    let schema = invalidMsg ? array(any(), invalidMsg) : array(any());

    if (v.required === true) {
      const msg =
        resolveMessage(v.messages?.['required'], localization) ?? 'This field is required';
      schema = schema.check(refine((val) => (val as unknown[]).length > 0, { error: msg }));
    }

    if (typeof v.minItems === 'number') {
      const msg = resolveMessage(v.messages?.['minItems'], localization);
      const threshold = v.minItems;
      schema = schema.check(
        msg
          ? refine((val) => (val as unknown[]).length >= threshold, { error: msg })
          : minLength(threshold),
      );
    }

    if (typeof v.maxItems === 'number') {
      const msg = resolveMessage(v.messages?.['maxItems'], localization);
      const threshold = v.maxItems;
      schema = schema.check(
        msg
          ? refine((val) => (val as unknown[]).length <= threshold, { error: msg })
          : maxLength(threshold),
      );
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
