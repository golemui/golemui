import { type I18nTranslator, isStandardValidateSuccess, standardValidate } from '@golemui/core';
import { type StandardSchemaV1 } from '@standard-schema/spec';
import {
  type ArrayValidator,
  type BooleanValidator,
  type CustomValidatorSchemas,
  type FilesValidator,
  type FileValidator,
  initValidators,
  type NumberValidator,
  type StringValidator,
  type Validator,
} from './validators';

const validate = initValidators();

function isValid(schema: ReturnType<typeof validate>, value: unknown) {
  const result = standardValidate(schema, value) as StandardSchemaV1.Result<unknown>;
  return isStandardValidateSuccess(result);
}

function getErrors(schema: ReturnType<typeof validate>, value: unknown): string[] {
  const result = standardValidate(schema, value) as StandardSchemaV1.Result<unknown>;
  return isStandardValidateSuccess(result) ? [] : result.issues.map((i) => i.message);
}

const mockTranslator = (translations: Record<string, string>): I18nTranslator => ({
  get lang() {
    return 'en';
  },
  translate(key, _params, defaultValue) {
    return translations[key] ?? defaultValue ?? key;
  },
  subscribe() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  },
});

describe('Golem validators', () => {
  describe('ArrayValidator', () => {
    describe('optional (required not set)', () => {
      const schema = validate({ type: 'array' } satisfies ArrayValidator);

      it('accepts undefined', () => {
        expect(isValid(schema, undefined)).toBe(true);
      });

      it('accepts an empty array', () => {
        expect(isValid(schema, [])).toBe(true);
      });

      it('accepts a non-empty array', () => {
        expect(isValid(schema, [1, 2, 3])).toBe(true);
      });

      it('rejects non-array values', () => {
        expect(isValid(schema, 'not an array')).toBe(false);
        expect(isValid(schema, 42)).toBe(false);
      });
    });

    describe('required', () => {
      const schema = validate({ type: 'array', required: true } satisfies ArrayValidator);

      it('rejects an empty array', () => {
        expect(isValid(schema, [])).toBe(false);
      });

      it('accepts a non-empty array', () => {
        expect(isValid(schema, [1])).toBe(true);
      });
    });

    describe('minItems', () => {
      const schema = validate({ type: 'array', minItems: 2 } satisfies ArrayValidator);

      it('rejects arrays below the minimum', () => {
        expect(isValid(schema, [])).toBe(false);
        expect(isValid(schema, [1])).toBe(false);
      });

      it('accepts arrays at or above the minimum', () => {
        expect(isValid(schema, [1, 2])).toBe(true);
        expect(isValid(schema, [1, 2, 3])).toBe(true);
      });
    });

    describe('maxItems', () => {
      const schema = validate({ type: 'array', maxItems: 2 } satisfies ArrayValidator);

      it('rejects arrays above the maximum', () => {
        expect(isValid(schema, [1, 2, 3])).toBe(false);
      });

      it('accepts arrays at or below the maximum', () => {
        expect(isValid(schema, [])).toBe(true);
        expect(isValid(schema, [1])).toBe(true);
        expect(isValid(schema, [1, 2])).toBe(true);
      });
    });

    describe('minItems + maxItems', () => {
      const schema = validate({ type: 'array', minItems: 1, maxItems: 3 } satisfies ArrayValidator);

      it('rejects arrays outside the range', () => {
        expect(isValid(schema, [])).toBe(false);
        expect(isValid(schema, [1, 2, 3, 4])).toBe(false);
      });

      it('accepts arrays within the range', () => {
        expect(isValid(schema, [1])).toBe(true);
        expect(isValid(schema, [1, 2])).toBe(true);
        expect(isValid(schema, [1, 2, 3])).toBe(true);
      });
    });
  });

  const uploaded = {
    id: 'f1',
    name: 'cv.pdf',
    size: 1024,
    type: 'application/pdf',
    status: 'uploaded',
    data: { url: 'https://cdn.example.com/cv.pdf' },
  };
  const uploading = {
    id: 'f2',
    name: 'photo.png',
    size: 2048,
    type: 'image/png',
    status: 'uploading',
  };
  const failed = { ...uploading, id: 'f3', status: 'error', error: 'Network error' };

  describe('FileValidator', () => {
    describe('optional (required not set)', () => {
      const schema = validate({ type: 'file' } satisfies FileValidator);

      it('accepts undefined and null (the widget writes null on removal)', () => {
        expect(isValid(schema, undefined)).toBe(true);
        expect(isValid(schema, null)).toBe(true);
      });

      it('accepts an uploaded item', () => {
        expect(isValid(schema, uploaded)).toBe(true);
      });

      it('rejects a value that is not a file item', () => {
        expect(isValid(schema, 'cv.pdf')).toBe(false);
        expect(isValid(schema, { name: 'cv.pdf' })).toBe(false);
        expect(isValid(schema, { ...uploaded, status: 'done' })).toBe(false);
        expect(getErrors(schema, 'cv.pdf')).toEqual(['Invalid file']);
      });
    });

    describe('required', () => {
      const schema = validate({ type: 'file', required: true } satisfies FileValidator);

      it('rejects undefined and null', () => {
        expect(getErrors(schema, undefined)).toEqual(['This field is required']);
        expect(getErrors(schema, null)).toEqual(['This field is required']);
      });

      it('accepts an uploaded item', () => {
        expect(isValid(schema, uploaded)).toBe(true);
      });
    });

    describe('blockPendingUploads', () => {
      it('blocks uploading and failed items by default', () => {
        const schema = validate({ type: 'file' } satisfies FileValidator);
        expect(getErrors(schema, uploading)).toEqual(['Wait for the upload to finish']);
        expect(isValid(schema, failed)).toBe(false);
      });

      it('lets pending items through when disabled', () => {
        const schema = validate({
          type: 'file',
          blockPendingUploads: false,
        } satisfies FileValidator);
        expect(isValid(schema, uploading)).toBe(true);
        expect(isValid(schema, failed)).toBe(true);
      });

      it('uses the custom message', () => {
        const schema = validate({
          type: 'file',
          messages: { pendingUploads: 'Still uploading' },
        } satisfies FileValidator);
        expect(getErrors(schema, uploading)).toEqual(['Still uploading']);
      });
    });
  });

  describe('FilesValidator', () => {
    describe('optional (required not set)', () => {
      const schema = validate({ type: 'files' } satisfies FilesValidator);

      it('accepts undefined and an empty array', () => {
        expect(isValid(schema, undefined)).toBe(true);
        expect(isValid(schema, [])).toBe(true);
      });

      it('accepts uploaded items', () => {
        expect(isValid(schema, [uploaded, { ...uploaded, id: 'f9' }])).toBe(true);
      });

      it('rejects non-arrays and arrays with foreign items', () => {
        expect(isValid(schema, uploaded)).toBe(false);
        expect(isValid(schema, ['cv.pdf'])).toBe(false);
        expect(getErrors(schema, [uploaded, 'cv.pdf'])).toEqual(['Invalid file']);
      });
    });

    describe('required', () => {
      const schema = validate({ type: 'files', required: true } satisfies FilesValidator);

      it('rejects an empty array', () => {
        expect(getErrors(schema, [])).toEqual(['This field is required']);
      });

      it('accepts a non-empty array', () => {
        expect(isValid(schema, [uploaded])).toBe(true);
      });
    });

    describe('minItems / maxItems', () => {
      const schema = validate({
        type: 'files',
        minItems: 1,
        maxItems: 2,
        messages: { maxItems: 'Too many files' },
      } satisfies FilesValidator);

      it('rejects arrays outside the range', () => {
        expect(isValid(schema, [])).toBe(false);
        expect(getErrors(schema, [uploaded, uploaded, uploaded])).toEqual(['Too many files']);
      });

      it('accepts arrays within the range', () => {
        expect(isValid(schema, [uploaded])).toBe(true);
        expect(isValid(schema, [uploaded, uploaded])).toBe(true);
      });
    });

    describe('blockPendingUploads', () => {
      it('blocks the array while any item is not uploaded', () => {
        const schema = validate({ type: 'files' } satisfies FilesValidator);
        expect(getErrors(schema, [uploaded, uploading])).toEqual(['Wait for the upload to finish']);
        expect(isValid(schema, [uploaded, failed])).toBe(false);
      });

      it('lets pending items through when disabled', () => {
        const schema = validate({
          type: 'files',
          blockPendingUploads: false,
        } satisfies FilesValidator);
        expect(isValid(schema, [uploaded, uploading, failed])).toBe(true);
      });
    });
  });

  describe('StringValidator', () => {
    it('accepts undefined when not required', () => {
      const schema = validate({ type: 'string' } satisfies StringValidator);
      expect(isValid(schema, undefined)).toBe(true);
    });

    it('rejects non-string values', () => {
      const schema = validate({ type: 'string' } satisfies StringValidator);
      expect(isValid(schema, 42)).toBe(false);
      expect(isValid(schema, true)).toBe(false);
    });

    describe('required', () => {
      const schema = validate({ type: 'string', required: true } satisfies StringValidator);

      it('rejects empty string', () => {
        expect(isValid(schema, '')).toBe(false);
      });

      it('accepts non-empty string', () => {
        expect(isValid(schema, 'hello')).toBe(true);
      });
    });

    describe('minLength / maxLength', () => {
      const schema = validate({
        type: 'string',
        minLength: 2,
        maxLength: 4,
      } satisfies StringValidator);

      it('rejects strings outside the range', () => {
        expect(isValid(schema, 'a')).toBe(false);
        expect(isValid(schema, 'hello')).toBe(false);
      });

      it('accepts strings within the range', () => {
        expect(isValid(schema, 'ab')).toBe(true);
        expect(isValid(schema, 'abcd')).toBe(true);
      });
    });

    describe('pattern', () => {
      const schema = validate({ type: 'string', pattern: '^\\d+$' } satisfies StringValidator);

      it('rejects non-matching strings', () => {
        expect(isValid(schema, 'abc')).toBe(false);
      });

      it('accepts matching strings', () => {
        expect(isValid(schema, '123')).toBe(true);
      });
    });

    describe('enum', () => {
      const schema = validate({ type: 'string', enum: ['a', 'b', 'c'] } satisfies StringValidator);

      it('rejects values not in the enum', () => {
        expect(isValid(schema, 'd')).toBe(false);
      });

      it('accepts values in the enum', () => {
        expect(isValid(schema, 'a')).toBe(true);
        expect(isValid(schema, 'c')).toBe(true);
      });
    });

    describe('const', () => {
      const schema = validate({ type: 'string', const: 'only-this' } satisfies StringValidator);

      it('rejects other values', () => {
        expect(isValid(schema, 'other')).toBe(false);
      });

      it('accepts the exact const value', () => {
        expect(isValid(schema, 'only-this')).toBe(true);
      });
    });

    describe('format', () => {
      it('validates email', () => {
        const schema = validate({ type: 'string', format: 'email' } satisfies StringValidator);
        expect(isValid(schema, 'not-an-email')).toBe(false);
        expect(isValid(schema, 'user@example.com')).toBe(true);
      });

      it('validates url', () => {
        const schema = validate({ type: 'string', format: 'url' } satisfies StringValidator);
        expect(isValid(schema, 'not-a-url')).toBe(false);
        expect(isValid(schema, 'https://example.com')).toBe(true);
      });

      it('validates uuid', () => {
        const schema = validate({ type: 'string', format: 'uuid' } satisfies StringValidator);
        expect(isValid(schema, 'not-a-uuid')).toBe(false);
        expect(isValid(schema, '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      });

      it('validates date', () => {
        const schema = validate({ type: 'string', format: 'date' } satisfies StringValidator);
        expect(isValid(schema, '20260101')).toBe(false);
        expect(isValid(schema, '2026-01-01')).toBe(true);
      });

      it('validates time', () => {
        const schema = validate({ type: 'string', format: 'time' } satisfies StringValidator);
        // HH:mm:ss is what the gui-time widget emits
        expect(isValid(schema, '14:30:00')).toBe(true);
        expect(isValid(schema, '14:30')).toBe(true);
        expect(isValid(schema, '9:30')).toBe(false);
        expect(isValid(schema, '24:00')).toBe(false);
        expect(isValid(schema, '14:30:60')).toBe(false);
        expect(isValid(schema, '2026-07-03T14:30:00')).toBe(false);
      });

      it('validates date-time', () => {
        const schema = validate({ type: 'string', format: 'date-time' } satisfies StringValidator);
        // Offset-less local datetimes are what the gui date/time widgets emit
        expect(isValid(schema, '2026-07-03T14:30:00')).toBe(true);
        expect(isValid(schema, '2026-07-03T14:30:00Z')).toBe(true);
        expect(isValid(schema, '2026-07-03T14:30:00+02:00')).toBe(true);
        expect(isValid(schema, '2026-07-03')).toBe(false);
        expect(isValid(schema, '2026-07-03 14:30:00')).toBe(false);
      });

      it('throws a descriptive error for an unknown format', () => {
        const configWithBadFormat = {
          type: 'string',
          format: 'phone-number',
        } as unknown as StringValidator;
        expect(() => validate(configWithBadFormat)).toThrow(
          /Unknown string validation format: "phone-number"\. The "format" property must be one of:/,
        );
      });
    });
  });

  describe('NumberValidator', () => {
    it('accepts undefined when not required', () => {
      const schema = validate({ type: 'number' } satisfies NumberValidator);
      expect(isValid(schema, undefined)).toBe(true);
    });

    it('rejects non-number values', () => {
      const schema = validate({ type: 'number' } satisfies NumberValidator);
      expect(isValid(schema, 'abc')).toBe(false);
      expect(isValid(schema, true)).toBe(false);
    });

    describe('integer', () => {
      const schema = validate({ type: 'integer' } satisfies NumberValidator);

      it('rejects floats', () => {
        expect(isValid(schema, 1.5)).toBe(false);
      });

      it('accepts integers', () => {
        expect(isValid(schema, 1)).toBe(true);
        expect(isValid(schema, -10)).toBe(true);
      });
    });

    describe('minimum / maximum', () => {
      const schema = validate({
        type: 'number',
        minimum: 1,
        maximum: 10,
      } satisfies NumberValidator);

      it('rejects values outside the range', () => {
        expect(isValid(schema, 0)).toBe(false);
        expect(isValid(schema, 11)).toBe(false);
      });

      it('accepts values at the boundaries and within', () => {
        expect(isValid(schema, 1)).toBe(true);
        expect(isValid(schema, 5)).toBe(true);
        expect(isValid(schema, 10)).toBe(true);
      });
    });

    describe('exclusiveMinimum / exclusiveMaximum', () => {
      const schema = validate({
        type: 'number',
        exclusiveMinimum: 0,
        exclusiveMaximum: 10,
      } satisfies NumberValidator);

      it('rejects values at the exclusive boundaries', () => {
        expect(isValid(schema, 0)).toBe(false);
        expect(isValid(schema, 10)).toBe(false);
      });

      it('accepts values strictly within the range', () => {
        expect(isValid(schema, 0.1)).toBe(true);
        expect(isValid(schema, 9.9)).toBe(true);
      });
    });

    describe('multipleOf', () => {
      it('rejects non-multiples', () => {
        const schema = validate({ type: 'number', multipleOf: 5 } satisfies NumberValidator);
        expect(isValid(schema, 3)).toBe(false);
        expect(isValid(schema, 7)).toBe(false);
      });

      it('accepts multiples', () => {
        const schema = validate({ type: 'number', multipleOf: 5 } satisfies NumberValidator);
        expect(isValid(schema, 0)).toBe(true);
        expect(isValid(schema, 5)).toBe(true);
        expect(isValid(schema, 15)).toBe(true);
      });

      it('accepts decimals', () => {
        const schema = validate({ type: 'number', multipleOf: 0.5 } satisfies NumberValidator);
        expect(isValid(schema, 0)).toBe(true);
        expect(isValid(schema, 0.5)).toBe(true);
        expect(isValid(schema, 1)).toBe(true);
        expect(isValid(schema, 7.1)).toBe(false);
      });
    });

    describe('enum', () => {
      const schema = validate({ type: 'number', enum: [1, 2, 3] } satisfies NumberValidator);

      it('rejects values not in the enum', () => {
        expect(isValid(schema, 4)).toBe(false);
      });

      it('accepts values in the enum', () => {
        expect(isValid(schema, 1)).toBe(true);
        expect(isValid(schema, 3)).toBe(true);
      });
    });

    describe('const', () => {
      const schema = validate({ type: 'number', const: 42 } satisfies NumberValidator);

      it('rejects other values', () => {
        expect(isValid(schema, 1)).toBe(false);
      });

      it('accepts the exact const value', () => {
        expect(isValid(schema, 42)).toBe(true);
      });
    });
  });

  describe('BooleanValidator', () => {
    it('accepts undefined when not required', () => {
      const schema = validate({ type: 'boolean' } satisfies BooleanValidator);
      expect(isValid(schema, undefined)).toBe(true);
    });

    it('rejects non-boolean values', () => {
      const schema = validate({ type: 'boolean' } satisfies BooleanValidator);
      expect(isValid(schema, 'true')).toBe(false);
      expect(isValid(schema, 1)).toBe(false);
    });

    it('accepts true and false', () => {
      const schema = validate({ type: 'boolean' } satisfies BooleanValidator);
      expect(isValid(schema, true)).toBe(true);
      expect(isValid(schema, false)).toBe(true);
    });

    describe('const', () => {
      const schema = validate({ type: 'boolean', const: true } satisfies BooleanValidator);

      it('rejects the other boolean', () => {
        expect(isValid(schema, false)).toBe(false);
      });

      it('accepts the const value', () => {
        expect(isValid(schema, true)).toBe(true);
      });
    });
  });

  describe('CustomValidator', () => {
    const customValidators: CustomValidatorSchemas = {
      minAge: (min: number) => validate({ type: 'number', minimum: min }),
    };
    const validateWithCustom = initValidators(customValidators);

    it('validates using the custom schema function', () => {
      const schema = validateWithCustom({ type: 'custom', minAge: 18 });
      expect(isValid(schema, 17)).toBe(false);
      expect(isValid(schema, 18)).toBe(true);
      expect(isValid(schema, 25)).toBe(true);
    });

    it('throws when no customValidators are provided', () => {
      expect(() => validate({ type: 'custom', minAge: 18 })).toThrow();
    });

    it('throws a descriptive error for a rule name that is not registered', () => {
      expect(() => validateWithCustom({ type: 'custom', minAgeTypo: 18 })).toThrow(
        /Unknown custom validator rule "minAgeTypo"\. Registered rules: "minAge"\./,
      );
    });

    it('lists no registered rules when the customValidators object is empty', () => {
      const validateWithEmptyCustom = initValidators({});
      expect(() => validateWithEmptyCustom({ type: 'custom', minAge: 18 })).toThrow(
        /Unknown custom validator rule "minAge"\. Registered rules: \(none\)\./,
      );
    });
  });

  describe('unknown validator config', () => {
    it('throws a descriptive error when the config has no known type', () => {
      const typelessConfig = { required: true } as unknown as Validator;
      expect(() => validate(typelessConfig)).toThrow(/Unknown validator config/);
    });
  });

  describe('messages', () => {
    describe('StringValidator', () => {
      it('uses a plain string message for required', () => {
        const schema = validate({
          type: 'string',
          required: true,
          messages: { required: 'Username is required' },
        } satisfies StringValidator);
        expect(getErrors(schema, '')).toEqual(['Username is required']);
      });

      it('uses a TranslationConfig message for required (with key + default)', () => {
        const translator = mockTranslator({ 'errors.username.required': 'Translated required' });
        const validateWithI18n = initValidators();
        const schema = validateWithI18n(
          {
            type: 'string',
            required: true,
            messages: {
              required: { key: 'errors.username.required', default: 'Username is required' },
            },
          } satisfies StringValidator,
          translator,
        );
        expect(getErrors(schema, '')).toEqual(['Translated required']);
      });

      it('falls back to the default value when translation key is not found', () => {
        const translator = mockTranslator({});
        const validateWithI18n = initValidators();
        const schema = validateWithI18n(
          {
            type: 'string',
            required: true,
            messages: { required: { key: 'missing.key', default: 'Fallback required message' } },
          } satisfies StringValidator,
          translator,
        );
        expect(getErrors(schema, '')).toEqual(['Fallback required message']);
      });

      it('uses a plain string message for minLength', () => {
        const schema = validate({
          type: 'string',
          minLength: 4,
          messages: { minLength: 'Must be at least 4 characters' },
        } satisfies StringValidator);
        expect(getErrors(schema, 'ab')).toEqual(['Must be at least 4 characters']);
        expect(getErrors(schema, 'abcd')).toEqual([]);
      });

      it('uses a plain string message for maxLength', () => {
        const schema = validate({
          type: 'string',
          maxLength: 5,
          messages: { maxLength: 'Must be 5 characters or fewer' },
        } satisfies StringValidator);
        expect(getErrors(schema, 'toolong')).toEqual(['Must be 5 characters or fewer']);
        expect(getErrors(schema, 'ok')).toEqual([]);
      });

      it('uses a plain string message for pattern', () => {
        const schema = validate({
          type: 'string',
          pattern: '^\\d+$',
          messages: { pattern: 'Only digits allowed' },
        } satisfies StringValidator);
        expect(getErrors(schema, 'abc')).toEqual(['Only digits allowed']);
        expect(getErrors(schema, '123')).toEqual([]);
      });

      it('falls back to Zod default message when no messages key is provided', () => {
        const schema = validate({ type: 'string', required: true } satisfies StringValidator);
        expect(getErrors(schema, '')).toEqual(['This field is required']);
      });

      it('uses a plain string message for type mismatch', () => {
        const schema = validate({
          type: 'string',
          messages: { invalid: 'Must be a text value' },
        } satisfies StringValidator);
        expect(getErrors(schema, 42)).toEqual(['Must be a text value']);
      });
    });

    describe('NumberValidator', () => {
      it('uses a plain string message for type mismatch (null)', () => {
        const schema = validate({
          type: 'number',
          minimum: 18,
          messages: { invalid: 'Please enter a valid number' },
        } satisfies NumberValidator);
        expect(getErrors(schema, null)).toEqual(['Please enter a valid number']);
        expect(getErrors(schema, 'abc')).toEqual(['Please enter a valid number']);
      });

      it('uses a TranslationConfig message for type mismatch', () => {
        const translator = mockTranslator({ 'errors.age.invalid': 'Age must be a number' });
        const validateWithI18n = initValidators();
        const schema = validateWithI18n(
          {
            type: 'number',
            messages: {
              invalid: { key: 'errors.age.invalid', default: 'Please enter a valid number' },
            },
          } satisfies NumberValidator,
          translator,
        );
        expect(getErrors(schema, null)).toEqual(['Age must be a number']);
      });
    });

    describe('ArrayValidator', () => {
      it('uses a plain string message for required', () => {
        const schema = validate({
          type: 'array',
          required: true,
          messages: { required: 'At least one item is required' },
        } satisfies ArrayValidator);
        expect(getErrors(schema, [])).toEqual(['At least one item is required']);
      });

      it('uses a plain string message for minItems', () => {
        const schema = validate({
          type: 'array',
          minItems: 2,
          messages: { minItems: 'Select at least 2 items' },
        } satisfies ArrayValidator);
        expect(getErrors(schema, [1])).toEqual(['Select at least 2 items']);
        expect(getErrors(schema, [1, 2])).toEqual([]);
      });
    });

    describe('NumberValidator', () => {
      it('uses a plain string message for minimum', () => {
        const schema = validate({
          type: 'number',
          minimum: 18,
          messages: { minimum: 'Must be 18 or older' },
        } satisfies NumberValidator);
        expect(getErrors(schema, 17)).toEqual(['Must be 18 or older']);
        expect(getErrors(schema, 18)).toEqual([]);
      });
    });
  });
});
