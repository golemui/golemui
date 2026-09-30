import { describe, expect, it } from 'vitest';
import { type JsonSchema } from './types';
import { discriminatorOf, type UnionBranchInfo } from './unions';

const branch = (properties: JsonSchema, extra: Partial<UnionBranchInfo> = {}): UnionBranchInfo => ({
  schema: { type: 'object', properties },
  ...extra,
});

describe('discriminatorOf: without OpenAPI discriminator', () => {
  it('finds the property with a distinct const in every branch', () => {
    const branches = [
      branch({ note: { type: 'string' }, method: { const: 'card' } }),
      branch({ method: { const: 'bank' }, iban: { type: 'string' } }),
    ];

    expect(discriminatorOf({}, branches)).toEqual({ property: 'method', values: ['card', 'bank'] });
  });

  it('accepts a one-value enum and non-string values', () => {
    const branches = [branch({ version: { enum: [1] } }), branch({ version: { const: 2 } })];

    expect(discriminatorOf({}, branches)).toEqual({ property: 'version', values: [1, 2] });
  });

  it('skips a property whose values repeat and takes the next one', () => {
    const branches = [
      branch({ group: { const: 'pay' }, method: { const: 'card' } }),
      branch({ group: { const: 'pay' }, method: { const: 'bank' } }),
    ];

    expect(discriminatorOf({}, branches)?.property).toBe('method');
  });

  it.each([
    [
      'a branch has no const',
      [branch({ kind: { const: 'a' } }), branch({ kind: { type: 'string' } })],
    ],
    ['the values repeat', [branch({ kind: { const: 'a' } }), branch({ kind: { const: 'a' } })]],
    [
      'a value is not a literal',
      [branch({ kind: { const: { a: 1 } } }), branch({ kind: { const: 'b' } })],
    ],
  ])('is undefined when %s', (_, branches) => {
    expect(discriminatorOf({}, branches)).toBeUndefined();
  });
});

describe('discriminatorOf: with OpenAPI discriminator', () => {
  it('reads the const of the named property first', () => {
    const union = { discriminator: { propertyName: 'kind' } };
    const branches = [
      branch({ kind: { const: 'a' }, first: { const: 'x' } }),
      branch({ kind: { const: 'b' }, first: { const: 'y' } }),
    ];

    expect(discriminatorOf(union, branches)).toEqual({ property: 'kind', values: ['a', 'b'] });
  });

  it('falls back to the mapping key of the branch $ref, then to its definition name', () => {
    const union = {
      discriminator: { propertyName: 'petType', mapping: { cat: '#/components/schemas/Cat' } },
    };
    const branches = [
      branch({ petType: { type: 'string' } }, { ref: '#/components/schemas/Cat', defName: 'Cat' }),
      branch({ petType: { type: 'string' } }, { ref: '#/components/schemas/Dog', defName: 'Dog' }),
    ];

    expect(discriminatorOf(union, branches)).toEqual({
      property: 'petType',
      values: ['cat', 'Dog'],
    });
  });

  it('is undefined when a branch has no value', () => {
    const union = { discriminator: { propertyName: 'kind' } };

    expect(discriminatorOf(union, [branch({ kind: { const: 'a' } }), branch({})])).toBeUndefined();
  });
});
