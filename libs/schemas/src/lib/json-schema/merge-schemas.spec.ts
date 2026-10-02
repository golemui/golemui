import { describe, expect, it } from 'vitest';
import { declaredTypes, mergeSchemaParts, type SchemaPart } from './merge-schemas';
import { type JsonSchema } from './types';

const part = (schema: JsonSchema, pointer = '/part'): SchemaPart => ({
  schema,
  pointer,
  allowedTypes: declaredTypes(schema),
});

const merge = (...schemas: JsonSchema[]) =>
  mergeSchemaParts(
    schemas.map((schema, index) => part(schema, `/allOf/${index}`)),
    new WeakMap(),
  );

describe('declaredTypes', () => {
  it.each([
    [{ type: 'string' }, ['string']],
    [{ type: 'number' }, ['number', 'integer']],
    [{ type: ['number', 'null'] }, ['number', 'integer', 'null']],
    [{ type: ['integer', 'number'] }, ['integer', 'number']],
    [{ title: 'untyped' }, undefined],
  ])('%j -> %j', (schema, types) => {
    expect(declaredTypes(schema)).toEqual(types);
  });
});

describe('mergeSchemaParts', () => {
  it('intersects the types, number includes integer', () => {
    expect(merge({ type: 'number' }, { type: 'integer' }).allowedTypes).toEqual(['integer']);
    expect(merge({ type: ['string', 'null'] }, { title: 'any type' }).allowedTypes).toEqual([
      'string',
      'null',
    ]);
  });

  it('keeps the first types and reports a conflict when no type is left', () => {
    const merged = merge({ type: 'string' }, { type: 'boolean' });

    expect(merged.allowedTypes).toEqual(['string']);
    expect(merged.conflicts).toEqual([{ keyword: 'type', pointer: '/allOf/1' }]);
  });

  it('combines the properties and the required lists', () => {
    const merged = merge(
      { properties: { name: { type: 'string' } }, required: ['name'] },
      { properties: { email: { type: 'string' } }, required: ['email', 'name'] },
    );

    expect(merged.schema['properties']).toEqual({
      name: { type: 'string' },
      email: { type: 'string' },
    });
    expect(merged.schema['required']).toEqual(['name', 'email']);
    expect(merged.conflicts).toEqual([]);
  });

  it('wraps a property defined by several parts in allOf, pointing at the first one', () => {
    const first = { type: 'string', maxLength: 10 };
    const pointers = new WeakMap<object, string>([[first, '/$defs/Base/properties/code']]);

    const merged = mergeSchemaParts(
      [part({ properties: { code: first } }), part({ properties: { code: { minLength: 2 } } })],
      pointers,
    );

    const code = (merged.schema['properties'] as Record<string, object>)['code'];
    expect(code).toEqual({ allOf: [first, { minLength: 2 }] });
    expect(pointers.get(code)).toBe('/$defs/Base/properties/code');
  });

  it('keeps one copy of a property that several parts define the same way', () => {
    const merged = merge(
      { properties: { id: { type: 'string' } } },
      { properties: { id: { type: 'string' } } },
    );

    expect(merged.schema['properties']).toEqual({ id: { type: 'string' } });
  });

  it('takes the tightest bounds', () => {
    const merged = merge(
      { minimum: 1, maximum: 100, minLength: 2, maxItems: 5 },
      { minimum: 5, maximum: 50, minLength: 1, maxItems: 9 },
    );

    expect(merged.schema).toEqual({ minimum: 5, maximum: 50, minLength: 2, maxItems: 5 });
  });

  it('intersects enums and reports a conflict when nothing is left', () => {
    expect(merge({ enum: ['a', 'b', 'c'] }, { enum: ['c', 'b'] }).schema['enum']).toEqual([
      'b',
      'c',
    ]);

    const disjoint = merge({ enum: ['a'] }, { enum: ['b'] });
    expect(disjoint.schema['enum']).toEqual(['a']);
    expect(disjoint.conflicts).toEqual([{ keyword: 'enum', pointer: '/allOf/1' }]);
  });

  it('keeps the first value and reports a conflict for keywords that must agree', () => {
    const merged = merge(
      { pattern: '^a', format: 'email', const: 1 },
      { pattern: '^b', format: 'email', const: 2 },
    );

    expect(merged.schema).toEqual({ pattern: '^a', format: 'email', const: 1 });
    expect(merged.conflicts.map((conflict) => conflict.keyword)).toEqual(['pattern', 'const']);
  });

  it('lets the first part win for annotations, without a conflict', () => {
    const merged = merge(
      { title: 'Shipping address', default: 'x' },
      { title: 'Address', description: 'Where to send it', default: 'y' },
    );

    expect(merged.schema).toEqual({
      title: 'Shipping address',
      default: 'x',
      description: 'Where to send it',
    });
    expect(merged.conflicts).toEqual([]);
  });

  it('wraps two different item schemas in allOf', () => {
    const merged = merge({ items: { type: 'string' } }, { items: { maxLength: 3 } });

    expect(merged.schema['items']).toEqual({ allOf: [{ type: 'string' }, { maxLength: 3 }] });
  });

  it('never modifies the parts', () => {
    const first = { properties: { a: { type: 'string' } }, required: ['a'] };
    const second = { properties: { b: { type: 'string' } }, required: ['b'] };

    merge(first, second);

    expect(first).toEqual({ properties: { a: { type: 'string' } }, required: ['a'] });
    expect(second).toEqual({ properties: { b: { type: 'string' } }, required: ['b'] });
  });
});
