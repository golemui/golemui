import type { JsonSchema, JsonType, SchemaNode } from '@golemui/schemas/json-schema';
import { describe, expect, it } from 'vitest';
import { guiValidator } from './gui-validator';

const nodeOf = (type: JsonType, schema: JsonSchema, required = false): SchemaNode => ({
  schema: { type, ...schema },
  type,
  nullable: false,
  path: 'field',
  pointer: '/properties/field',
  required,
  repeaterDepth: 0,
});

describe('guiValidator', () => {
  it('builds a string validator in the order of the gui schema', () => {
    const validator = guiValidator(
      nodeOf('string', { maxLength: 80, minLength: 2, pattern: '^a', format: 'email' }, true),
    );

    expect(validator).toEqual({
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 80,
      pattern: '^a',
      format: 'email',
    });
    expect(Object.keys(validator ?? {}).slice(0, 2)).toEqual(['type', 'required']);
  });

  it('maps uri to url and leaves out the formats the date and time widgets handle', () => {
    expect(guiValidator(nodeOf('string', { format: 'uri' }))).toEqual({
      type: 'string',
      format: 'url',
    });
    for (const format of ['date', 'date-time', 'time', 'unknown-format']) {
      expect(guiValidator(nodeOf('string', { format }))).toBeUndefined();
    }
  });

  it('keeps const and the enum values of the node type', () => {
    expect(guiValidator(nodeOf('string', { enum: ['a', 'b', 3] }))).toEqual({
      type: 'string',
      enum: ['a', 'b'],
    });
    expect(guiValidator(nodeOf('integer', { enum: [1, 2], const: 2 }))).toEqual({
      type: 'integer',
      const: 2,
      enum: [1, 2],
    });
  });

  it('builds number bounds', () => {
    expect(
      guiValidator(
        nodeOf('number', { minimum: 0, exclusiveMaximum: 10, multipleOf: 0.5, maximum: 'x' }),
      ),
    ).toEqual({ type: 'number', minimum: 0, exclusiveMaximum: 10, multipleOf: 0.5 });
  });

  it('makes a boolean with const true required, the mandatory checkbox pair', () => {
    expect(guiValidator(nodeOf('boolean', { const: true }))).toEqual({
      type: 'boolean',
      required: true,
      const: true,
    });
  });

  it('builds array bounds', () => {
    expect(guiValidator(nodeOf('array', { minItems: 1, maxItems: 3, uniqueItems: true }))).toEqual({
      type: 'array',
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
    });
  });

  it('is undefined when there is nothing to check, and for objects', () => {
    expect(guiValidator(nodeOf('string', {}))).toBeUndefined();
    expect(guiValidator(nodeOf('object', {}, true))).toBeUndefined();
  });
});
