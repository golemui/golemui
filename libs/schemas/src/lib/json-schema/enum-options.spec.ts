import { describe, expect, it } from 'vitest';
import { enumOptionsOf } from './enum-options';
import { humanize } from './text';
import { type JsonSchema, type SchemaNode } from './types';

const nodeOf = (schema: JsonSchema): SchemaNode => ({
  schema,
  nullable: false,
  path: 'field',
  pointer: '/properties/field',
  required: false,
  repeaterDepth: 0,
});

describe('humanize', () => {
  it.each([
    ['firstName', 'First Name'],
    ['last_name', 'Last name'],
    ['zip-code', 'Zip code'],
    ['api__key', 'Api key'],
    ['US', 'US'],
    ['', ''],
  ])('%s -> %s', (name, label) => {
    expect(humanize(name)).toBe(label);
  });
});

describe('enumOptionsOf', () => {
  it('labels enum values in readable form', () => {
    expect(enumOptionsOf(nodeOf({ enum: ['free_plan', 'pro', 3, true] }))).toEqual([
      { label: 'Free plan', value: 'free_plan' },
      { label: 'Pro', value: 'pro' },
      { label: '3', value: 3 },
      { label: 'true', value: true },
    ]);
  });

  it('uses enumNames as labels when present', () => {
    expect(enumOptionsOf(nodeOf({ enum: ['sm', 'lg'], enumNames: ['Small', 'Large'] }))).toEqual([
      { label: 'Small', value: 'sm' },
      { label: 'Large', value: 'lg' },
    ]);
  });

  it('reads a oneOf or anyOf of const branches, labelled by title', () => {
    const options = [
      { label: 'Small', value: 'sm' },
      { label: 'Lg', value: 'lg' },
    ];
    const branches = [{ const: 'sm', title: 'Small' }, { const: 'lg' }];

    expect(enumOptionsOf(nodeOf({ oneOf: branches }))).toEqual(options);
    expect(enumOptionsOf(nodeOf({ anyOf: branches }))).toEqual(options);
  });

  it('skips values that cannot be an option', () => {
    expect(enumOptionsOf(nodeOf({ enum: ['a', { b: 1 }, ['c']] }))).toEqual([
      { label: 'A', value: 'a' },
    ]);
  });

  it('is undefined for other nodes', () => {
    expect(enumOptionsOf(nodeOf({ type: 'string' }))).toBeUndefined();
    expect(enumOptionsOf(nodeOf({ oneOf: [{ type: 'string' }, { const: 'x' }] }))).toBeUndefined();
  });
});
