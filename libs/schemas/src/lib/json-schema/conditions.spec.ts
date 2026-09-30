import { describe, expect, it } from 'vitest';
import { compileCondition, type CompiledCondition } from './conditions';

// References read like `$form.a?.b`, so the expected expressions stay short.
const compile = (schema: unknown): CompiledCondition =>
  compileCondition(schema, (segments) => `$form.${segments.join('?.')}`);

const expressionOf = (schema: unknown) => {
  const compiled = compile(schema);
  return 'expression' in compiled ? compiled.expression : `unsupported: ${compiled.unsupported}`;
};

describe('compileCondition', () => {
  it('compiles the boolean schemas', () => {
    expect(expressionOf(true)).toBe('true');
    expect(expressionOf(false)).toBe('false');
  });

  it('compiles a required const without a presence test', () => {
    expect(compile({ properties: { country: { const: 'US' } }, required: ['country'] })).toEqual({
      expression: '$form.country === "US"',
      vacuous: false,
      reads: ['country'],
    });
  });

  it('lets a tested property that is not required pass when absent, and reports it', () => {
    expect(compile({ properties: { country: { const: 'US' } } })).toEqual({
      expression: '($form.country === undefined || $form.country === "US")',
      vacuous: true,
      reads: ['country'],
    });
  });

  it.each([
    [{ enum: ['US', 'CA'] }, '($form.x === "US" || $form.x === "CA")'],
    [{ not: { const: 'US' } }, '$form.x !== undefined && !($form.x === "US")'],
    [{ not: { enum: [1, 2] } }, '$form.x !== undefined && !(($form.x === 1 || $form.x === 2))'],
    [{ minimum: 18 }, '$form.x >= 18'],
    [{ exclusiveMinimum: 0, maximum: 9.5 }, '$form.x > 0 && $form.x <= 9.5'],
    [{ exclusiveMaximum: 10 }, '$form.x < 10'],
    [{ type: 'number', minimum: 1, title: 'annotations are ignored' }, '$form.x >= 1'],
    [{ const: null }, '$form.x !== undefined && $form.x === null'],
    [{ const: 'v1.2' }, '$form.x === "v1." + "2"'],
    [true, '$form.x !== undefined && true'],
  ])('compiles the required property %j', (schema, expression) => {
    expect(expressionOf({ properties: { x: schema }, required: ['x'] })).toBe(expression);
  });

  it('compiles required names without a property schema as presence tests', () => {
    expect(expressionOf({ required: ['card', 'cvc'] })).toBe(
      '$form.card !== undefined && $form.cvc !== undefined',
    );
  });

  it('compiles nested properties with paths below the parent', () => {
    expect(
      expressionOf({
        properties: {
          address: { properties: { country: { const: 'US' } }, required: ['country'] },
        },
        required: ['address'],
      }),
    ).toBe('$form.address !== undefined && $form.address?.country === "US"');
  });

  it('ignores type object at the top level', () => {
    expect(expressionOf({ type: 'object', required: ['a'] })).toBe('$form.a !== undefined');
  });

  it.each([
    [{ properties: { x: { pattern: '^a' } } }, 'pattern'],
    [{ properties: { x: { const: { a: 1 } } } }, 'const'],
    [{ properties: { x: { not: { pattern: '^a' } } } }, 'not'],
    [{ anyOf: [{ required: ['a'] }] }, 'anyOf'],
    [{ type: 'string' }, 'type'],
    [42, 'a value that is not a schema'],
  ])('reports what has no expression equivalent in %j', (schema, keyword) => {
    expect(compile(schema)).toEqual({ unsupported: keyword });
  });
});
