import { describe, expect, it } from 'vitest';
import { appendPointer, definitionNameOf, resolveRef } from './pointer';

const document = {
  $id: 'https://example.com/order.json',
  $defs: {
    Address: { type: 'object' },
    'a/b': { title: 'slash' },
    'a~b': { title: 'tilde' },
    'A B': { title: 'space' },
  },
  allOf: [{ title: 'first' }],
  components: { schemas: { User: { type: 'object' } } },
};

describe('appendPointer', () => {
  it('escapes ~ and / in each segment', () => {
    expect(appendPointer('/properties', 'a/b', 'c~d', 0)).toBe('/properties/a~1b/c~0d/0');
  });
});

describe('resolveRef', () => {
  it.each([
    ['#', document, ''],
    ['#/$defs/Address', document.$defs.Address, '/$defs/Address'],
    ['#/$defs/a~1b', document.$defs['a/b'], '/$defs/a~1b'],
    ['#/$defs/a~0b', document.$defs['a~b'], '/$defs/a~0b'],
    ['#/$defs/A%20B', document.$defs['A B'], '/$defs/A B'],
    ['#/allOf/0', document.allOf[0], '/allOf/0'],
    ['#/components/schemas/User', document.components.schemas.User, '/components/schemas/User'],
    ['https://example.com/order.json#/$defs/Address', document.$defs.Address, '/$defs/Address'],
  ])('resolves %s', (ref, target, pointer) => {
    expect(resolveRef(ref, document)).toEqual({ target, pointer });
  });

  it.each([
    ['#/$defs/Missing', 'points to nothing'],
    ['#/$defs/Address/type/length', 'points to nothing'],
    ['#/$defs/toString', 'points to nothing'],
    ['#address', 'Anchor refs are not supported'],
    ['other.json#/$defs/Address', 'Only refs inside the same document'],
    ['#/$defs/%E0%A4%A', 'not a valid URI fragment'],
  ])('reports why %s cannot be resolved', (ref, reason) => {
    const resolved = resolveRef(ref, document);
    expect('error' in resolved && resolved.error).toContain(reason);
  });
});

describe('definitionNameOf', () => {
  it.each([
    ['/$defs/Address', 'Address'],
    ['/definitions/Address', 'Address'],
    ['/components/schemas/User', 'User'],
    ['/$defs/Outer/$defs/Inner', 'Inner'],
    ['/$defs/a~1b', 'a/b'],
    ['/$defs/Address/properties/street', undefined],
    ['/properties/address', undefined],
  ])('%s -> %s', (pointer, name) => {
    expect(definitionNameOf(pointer)).toBe(name);
  });
});
