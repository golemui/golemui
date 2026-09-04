import {
  filterTap,
  type I18nTranslator,
  isStandardValidateSuccess,
  type Localizable,
  standardValidate,
  type ValidatorFn,
} from '@golemui/core';
import { type StandardSchemaV1 } from '@standard-schema/spec';
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
  type ZodMiniOptional,
  type ZodMiniType,
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
  'date-time': { schema: iso.datetime({ local: true, offset: true }) },
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

const fileStatuses = ['uploading', 'uploaded', 'error'] as const;

/**
 * Validates the envelope stored by the `fileUpload` widget (`FileItem | null`).
 * `blockPendingUploads` (default `true`) fails while the item's status is not
 * `uploaded`, so an in-progress or failed upload cannot be submitted.
 */
export interface FileValidator extends BaseValidator {
  type: 'file';
  blockPendingUploads?: boolean;
}

/**
 * Validates the envelope array stored by the `multiFileUpload` widget
 * (`FileItem[]`). `required` means non-empty, like `array`. An absent value
 * (`undefined` or `null`) counts as empty.
 */
export interface FilesValidator extends BaseValidator {
  type: 'files';
  minItems?: number;
  maxItems?: number;
  blockPendingUploads?: boolean;
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
  | FileValidator
  | FilesValidator
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

      case 'file':
        return fromFileValidator(validator, localization);

      case 'files':
        return fromFilesValidator(validator, localization);

      case 'custom': {
        if (!customValidators) {
          throw new Error(
            'Validator type "custom" requires a customValidators object, but it was not supplied.',
          );
        }
        return fromCustomValidator(validator, customValidators);
      }

      default: {
        const unknownValidator: never = validator;
        throw new Error(
          `Unknown validator config: ${JSON.stringify(unknownValidator)}. The "type" property must be one of: "string", "number", "integer", "boolean", "array", "file", "files", "custom".`,
        );
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
        throw new Error(
          `Unknown string validation format: ${JSON.stringify(v.format)}. The "format" property must be one of: ${stringFormatKeys.map((key) => `"${key}"`).join(', ')}.`,
        );
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

const DEFAULT_REQUIRED_MESSAGE = 'This field is required';
const DEFAULT_INVALID_FILE_MESSAGE = 'Invalid file';
const DEFAULT_PENDING_UPLOADS_MESSAGE = 'Wait for the upload to finish';

/**
 * Structural check of one `FileItem` envelope (see `@golemui/gui-shared`). The
 * validators lib sits below gui-shared, so the shape is mirrored here rather
 * than imported.
 */
function isFileItem(val: unknown): val is { status: (typeof fileStatuses)[number] } {
  if (val === null || typeof val !== 'object') {
    return false;
  }
  const item = val as Record<string, unknown>;
  return (
    typeof item['id'] === 'string' &&
    typeof item['name'] === 'string' &&
    typeof item['size'] === 'number' &&
    typeof item['type'] === 'string' &&
    typeof item['status'] === 'string' &&
    (fileStatuses as readonly string[]).includes(item['status'])
  );
}

// Deliberately not wrapped in `withOptional`: the widget writes `null` when the
// file is removed and zod's `optional()` only admits `undefined`.
function fromFileValidator(v: FileValidator, localization?: I18nTranslator) {
  const invalidMsg =
    resolveMessage(v.messages?.['invalid'], localization) ?? DEFAULT_INVALID_FILE_MESSAGE;
  const requiredMsg =
    resolveMessage(v.messages?.['required'], localization) ?? DEFAULT_REQUIRED_MESSAGE;
  const pendingMsg =
    resolveMessage(v.messages?.['pendingUploads'], localization) ?? DEFAULT_PENDING_UPLOADS_MESSAGE;
  const blockPending = v.blockPendingUploads !== false;

  return any().check(
    superRefine((val, ctx) => {
      if (val === null || val === undefined) {
        if (v.required === true) {
          ctx.addIssue({ code: 'custom', message: requiredMsg });
        }
        return;
      }
      if (!isFileItem(val)) {
        ctx.addIssue({ code: 'custom', message: invalidMsg });
        return;
      }
      if (blockPending && val.status !== 'uploaded') {
        ctx.addIssue({ code: 'custom', message: pendingMsg });
      }
    }),
  );
}

// Not wrapped in `withOptional`: the absent value is checked here, before the array
// type check, so a required empty field reports the required message and not "Invalid file".
function fromFilesValidator(v: FilesValidator, localization?: I18nTranslator) {
  const requiredMsg =
    resolveMessage(v.messages?.['required'], localization) ?? DEFAULT_REQUIRED_MESSAGE;
  const arraySchema = fromFilesArrayValidator(v, localization, requiredMsg);

  return any().check(
    superRefine((val, ctx) => {
      if (val === null || val === undefined) {
        if (v.required === true) {
          ctx.addIssue({ code: 'custom', message: requiredMsg });
        }
        return;
      }
      // Typed as the standard interface so the result type is the generic result and not the array.
      const result = standardValidate<StandardSchemaV1>(
        arraySchema,
        val,
      ) as StandardSchemaV1.Result<unknown>;
      if (isStandardValidateSuccess(result)) {
        return;
      }
      for (const issue of result.issues) {
        ctx.addIssue({ code: 'custom', message: issue.message });
      }
    }),
  );
}

// The checks for a present value. The caller resolves `requiredMsg`, so the absent
// value and the empty array report the same message.
function fromFilesArrayValidator(
  v: FilesValidator,
  localization: I18nTranslator | undefined,
  requiredMsg: string,
) {
  const invalidMsg =
    resolveMessage(v.messages?.['invalid'], localization) ?? DEFAULT_INVALID_FILE_MESSAGE;
  let schema = array(any(), invalidMsg).check(
    refine((val) => (val as unknown[]).every(isFileItem), { error: invalidMsg }),
  );

  if (v.required === true) {
    schema = schema.check(refine((val) => (val as unknown[]).length > 0, { error: requiredMsg }));
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

  if (v.blockPendingUploads !== false) {
    const msg =
      resolveMessage(v.messages?.['pendingUploads'], localization) ??
      DEFAULT_PENDING_UPLOADS_MESSAGE;
    // Foreign items are already reported by the `invalid` refinement above.
    schema = schema.check(
      refine(
        (val) =>
          (val as unknown[]).every((item) => !isFileItem(item) || item.status === 'uploaded'),
        { error: msg },
      ),
    );
  }

  return schema;
}

function fromCustomValidator(v: CustomValidator, customValidators: CustomValidatorSchemas) {
  return withOptional(v, (v) => {
    let schema = any();

    filterTap(
      Object.keys(v),
      // filter non-custom validator keys
      (key) => key !== 'type' && key !== 'required',
      (key) => {
        // This originates from the validator field in the JSON form
        const validatorInput = v[key];
        // This originates from the user-defined custom validators in the form
        const resolvedSchemaFn = customValidators[key];
        if (!resolvedSchemaFn) {
          const registeredRules = Object.keys(customValidators)
            .map((rule) => `"${rule}"`)
            .join(', ');
          throw new Error(
            `Unknown custom validator rule "${key}". Registered rules: ${registeredRules || '(none)'}.`,
          );
        }
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
      },
    );

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
