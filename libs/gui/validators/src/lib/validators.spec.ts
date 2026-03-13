import { isStandardValidateSuccess, standardValidate } from '@golemui/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  initValidators,
  ArrayValidator,
  BooleanValidator,
  CustomValidatorSchemas,
  NumberValidator,
  StringValidator,
} from './validators';

const validate = initValidators();

function isValid(schema: ReturnType<typeof validate>, value: unknown) {
  const result = standardValidate(schema, value) as StandardSchemaV1.Result<unknown>;
  return isStandardValidateSuccess(result);
}

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
      const schema = validate({ type: 'string', minLength: 2, maxLength: 4 } satisfies StringValidator);

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
      const schema = validate({ type: 'number', minimum: 1, maximum: 10 } satisfies NumberValidator);

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
      const schema = validate({ type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 10 } satisfies NumberValidator);

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
      const schema = validate({ type: 'number', multipleOf: 5 } satisfies NumberValidator);

      it('rejects non-multiples', () => {
        expect(isValid(schema, 3)).toBe(false);
        expect(isValid(schema, 7)).toBe(false);
      });

      it('accepts multiples', () => {
        expect(isValid(schema, 0)).toBe(true);
        expect(isValid(schema, 5)).toBe(true);
        expect(isValid(schema, 15)).toBe(true);
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
  });
});
