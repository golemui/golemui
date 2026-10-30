import { type StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { isStandardValidateSuccess, standardValidate } from './form-validator';

const requiredSchema: StandardSchemaV1<unknown> = {
  '~standard': {
    version: 1,
    vendor: 'form-validator-spec',
    validate: (value) => (value === '' ? { issues: [{ message: 'required' }] } : { value }),
  },
};

const asyncSchema: StandardSchemaV1<unknown> = {
  '~standard': {
    version: 1,
    vendor: 'form-validator-spec',
    validate: async (value) => ({ value }),
  },
};

describe('standardValidate', () => {
  it('returns the result of a synchronous schema', () => {
    // The return type is the schema output, so the result is cast as `validateAll` does.
    const success = standardValidate(requiredSchema, 'Joan') as StandardSchemaV1.Result<unknown>;
    const failure = standardValidate(requiredSchema, '') as StandardSchemaV1.Result<unknown>;

    expect(success).toEqual({ value: 'Joan' });
    expect(isStandardValidateSuccess(success)).toBe(true);
    expect(failure).toEqual({ issues: [{ message: 'required' }] });
    expect(isStandardValidateSuccess(failure)).toBe(false);
  });

  it('throws a TypeError for a schema that validates asynchronously', () => {
    expect(() => standardValidate(asyncSchema, 'Joan')).toThrow(TypeError);
    expect(() => standardValidate(asyncSchema, 'Joan')).toThrow(
      'Schema validation must be synchronous',
    );
  });
});
