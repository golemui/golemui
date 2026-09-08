import { describe, expect, it } from 'vitest';
import { validatorToJsonSchema } from './json-schema';

describe('validatorToJsonSchema', () => {
  it('returns undefined for anything that is not a gui validator object', () => {
    expect(validatorToJsonSchema(undefined)).toBeUndefined();
    expect(validatorToJsonSchema(null)).toBeUndefined();
    expect(validatorToJsonSchema('string')).toBeUndefined();
    expect(validatorToJsonSchema({ minLength: 3 })).toBeUndefined();
    expect(validatorToJsonSchema({ type: 'date' })).toBeUndefined();
  });

  it('copies the string keywords and maps the url format to uri', () => {
    expect(
      validatorToJsonSchema({
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: '^[a-z]+$',
        format: 'url',
        messages: { required: 'Needed' },
      }),
    ).toEqual({
      schema: { type: 'string', minLength: 3, maxLength: 20, pattern: '^[a-z]+$', format: 'uri' },
      required: true,
    });
  });

  it('keeps the formats JSON Schema shares with gui', () => {
    expect(validatorToJsonSchema({ type: 'string', format: 'email' })?.schema).toEqual({
      type: 'string',
      format: 'email',
    });
    expect(validatorToJsonSchema({ type: 'string', format: 'date-time' })?.schema).toEqual({
      type: 'string',
      format: 'date-time',
    });
  });

  it('copies the number keywords for number and integer', () => {
    expect(
      validatorToJsonSchema({
        type: 'integer',
        minimum: 1,
        maximum: 10,
        exclusiveMinimum: 0,
        exclusiveMaximum: 11,
        multipleOf: 1,
        enum: [1, 2, 3],
      }),
    ).toEqual({
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        exclusiveMinimum: 0,
        exclusiveMaximum: 11,
        multipleOf: 1,
        enum: [1, 2, 3],
      },
      required: false,
    });
    expect(validatorToJsonSchema({ type: 'number' })?.schema).toEqual({ type: 'number' });
  });

  it('copies const for booleans', () => {
    expect(validatorToJsonSchema({ type: 'boolean', required: true, const: true })).toEqual({
      schema: { type: 'boolean', const: true },
      required: true,
    });
  });

  it('copies the array keywords and translates the items validator recursively', () => {
    expect(
      validatorToJsonSchema({
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 5,
        uniqueItems: true,
        items: { type: 'string', minLength: 2 },
      }),
    ).toEqual({
      schema: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        uniqueItems: true,
        items: { type: 'string', minLength: 2 },
      },
      required: true,
    });
  });

  it('yields no type for file validators and drops blockPendingUploads', () => {
    expect(
      validatorToJsonSchema({ type: 'file', required: true, blockPendingUploads: false }),
    ).toEqual({ schema: {}, required: true });
    expect(validatorToJsonSchema({ type: 'files', minItems: 1, maxItems: 3 })).toEqual({
      schema: { minItems: 1, maxItems: 3 },
      required: false,
    });
  });

  it('reports only required for custom validators', () => {
    expect(validatorToJsonSchema({ type: 'custom', required: true, allowedNames: true })).toEqual({
      schema: {},
      required: true,
    });
  });
});
