import { describe, expect, it } from 'vitest';
import { cloneObject, get, set, unset } from './object';

describe('object.set', () => {
  it('sets dot notation paths', () => {
    const obj = {};
    set(obj, 'a.b.c', 'value');
    expect(obj).toEqual({ a: { b: { c: 'value' } } });
  });

  it('creates arrays for numeric indices', () => {
    const obj = {};
    set(obj, 'items.0.name', 'test');
    expect(obj).toEqual({ items: [{ name: 'test' }] });
  });

  it('overwrites existing values', () => {
    const obj = { a: { b: 'old' } };
    set(obj, 'a.b', 'new');
    expect(obj.a.b).toBe('new');
  });

  it('handles null/undefined objects', () => {
    expect(() => set(null as any, 'a.b', 'value')).toThrow();
    expect(() => set(undefined as any, 'a.b', 'value')).toThrow();
  });

  it('handles empty paths', () => {
    expect(() => set({ test: 'value' }, '', 'ignored')).toThrow();
  });

  it('overrides non-object values in path', () => {
    const obj = { a: 'string' };
    set(obj, 'a.b.c', 'nested');
    expect(obj).toEqual({ a: { b: { c: 'nested' } } });
  });

  it('returns the original object', () => {
    const obj = {};
    expect(set(obj, 'a', 'value')).toBe(obj);
  });

  describe('tsdoc examples', () => {
    it('basic property setting', () => {
      const obj = { a: 1 };
      set(obj, 'b', 2);

      expect(obj).toEqual({ a: 1, b: 2 });
    });

    it('nested property creation', () => {
      const obj = {};
      set(obj, 'user.name', 'John');

      expect(obj).toEqual({ user: { name: 'John' } });
    });

    it('deep nested path creation', () => {
      const obj = {};
      set(obj, 'config.api.endpoints.users', '/api/v1/users');

      expect(obj).toEqual({
        config: {
          api: {
            endpoints: {
              users: '/api/v1/users',
            },
          },
        },
      });
    });

    it('array index creation', () => {
      const obj = {};
      set(obj, 'items.0', 'first item');
      set(obj, 'items.2', 'third item');

      expect(obj).toEqual({
        items: ['first item', undefined, 'third item'],
      });
    });

    it('mixed object and array paths', () => {
      const obj = {};
      set(obj, 'users.0.name', 'Alice');
      set(obj, 'users.0.age', 25);
      set(obj, 'users.1.name', 'Bob');

      expect(obj).toEqual({
        users: [{ name: 'Alice', age: 25 }, { name: 'Bob' }],
      });
    });

    it('overwriting existing values', () => {
      const obj = { user: { name: 'John', age: 30 } };
      set(obj, 'user.name', 'Jane');
      set(obj, 'user.email', 'jane@example.com');

      expect(obj).toEqual({
        user: {
          name: 'Jane',
          age: 30,
          email: 'jane@example.com',
        },
      });
    });

    it('working with existing arrays', () => {
      const obj = { items: ['a', 'b'] };
      set(obj, 'items.5', 'f');

      expect(obj).toEqual({
        items: ['a', 'b', undefined, undefined, undefined, 'f'],
      });
    });
  });
});

describe('object.get', () => {
  const testObj = {
    user: {
      name: 'John',
      age: 30,
      addresses: [
        { street: '123 Main St', city: 'Boston', zipCode: '02101' },
        { street: '456 Oak Ave', city: 'NYC', zipCode: '10001' },
        null,
        { street: '789 Pine Rd', city: 'LA' },
      ],
      profile: {
        preferences: {
          theme: 'dark',
          notifications: true,
        },
        social: {
          twitter: '@johndoe',
          linkedin: null,
        },
      },
      hobbies: ['reading', 'coding', 'hiking'],
      metadata: {
        createdAt: '2023-01-01',
        tags: [],
      },
    },
    settings: {
      app: {
        version: '1.2.3',
      },
    },
    emptyObject: {},
    nullValue: null,
    undefinedValue: undefined,
    zeroValue: 0,
    emptyString: '',
    falseValue: false,
  };

  describe('basic object property access', () => {
    it('should get simple property', () => {
      expect(get(testObj, 'user.name')).toBe('John');
      expect(get(testObj, 'user.age')).toBe(30);
    });

    it('should get nested object properties', () => {
      expect(get(testObj, 'user.profile.preferences.theme')).toBe('dark');
      expect(get(testObj, 'user.profile.preferences.notifications')).toBe(true);
      expect(get(testObj, 'settings.app.version')).toBe('1.2.3');
    });

    it('should get deeply nested properties', () => {
      expect(get(testObj, 'user.profile.social.twitter')).toBe('@johndoe');
    });
  });

  describe('array access', () => {
    it('should access array elements by index', () => {
      expect(get(testObj, 'user.addresses.0.street')).toBe('123 Main St');
      expect(get(testObj, 'user.addresses.1.city')).toBe('NYC');
      expect(get(testObj, 'user.hobbies.0')).toBe('reading');
      expect(get(testObj, 'user.hobbies.2')).toBe('hiking');
    });

    it('should handle array of primitives', () => {
      expect(get(testObj, 'user.hobbies.1')).toBe('coding');
    });

    it('should handle empty arrays', () => {
      expect(get(testObj, 'user.metadata.tags.0')).toBeUndefined();
    });

    it('should handle null elements in arrays', () => {
      expect(get(testObj, 'user.addresses.2')).toBeNull();
      expect(() => get(testObj, 'user.addresses.2.city')).toThrow();
    });
  });

  describe('falsy values', () => {
    it('should return falsy values correctly', () => {
      expect(get(testObj, 'nullValue')).toBeNull();
      expect(get(testObj, 'undefinedValue')).toBeUndefined();
      expect(get(testObj, 'zeroValue')).toBe(0);
      expect(get(testObj, 'emptyString')).toBe('');
      expect(get(testObj, 'falseValue')).toBe(false);
    });

    it('should handle null values in nested paths', () => {
      expect(get(testObj, 'user.profile.social.linkedin')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should throw when null/undefined object', () => {
      expect(() => get(null as any, 'any.path')).toThrow();
      expect(() => get(undefined as any, 'any.path')).toThrow();
    });

    it('should handle empty path', () => {
      expect(get(testObj, '')).toBe(testObj);
    });

    it('should handle single property path', () => {
      expect(get(testObj, 'user')).toBe(testObj.user);
      expect(get(testObj, 'zeroValue')).toBe(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed object and array access', () => {
      expect(get(testObj, 'user.addresses.0.zipCode')).toBe('02101');
      expect(get(testObj, 'user.addresses.3.zipCode')).toBeUndefined();
    });

    it('should handle arrays of arrays', () => {
      const nestedArrayObj = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      };
      expect(get(nestedArrayObj, 'matrix.0.0')).toBe(1);
      expect(get(nestedArrayObj, 'matrix.1.2')).toBe(6);
      expect(get(nestedArrayObj, 'matrix.2.1')).toBe(8);
      expect(get(nestedArrayObj, 'matrix.3.0')).toBeUndefined();
    });

    it('should handle numeric string properties', () => {
      const numericPropObj = {
        '0': 'zero',
        '1': { nested: 'value' },
        normal: 'property',
      };
      expect(get(numericPropObj, '0')).toBe('zero');
      expect(get(numericPropObj, '1.nested')).toBe('value');
      expect(get(numericPropObj, 'normal')).toBe('property');
    });
  });
});

describe('object.unset', () => {
  it('removes a leaf key while preserving siblings', () => {
    const obj = { a: { b: { c: 1, d: 2 } } };
    unset(obj, 'a.b.c');
    expect(obj).toEqual({ a: { b: { d: 2 } } });
  });

  it('prunes empty plain object ancestors recursively', () => {
    const obj = { a: { b: { c: 1 } } };
    unset(obj, 'a.b.c');
    expect(obj).toEqual({});
  });

  it('prunes only the empty branch, leaving non-empty siblings intact', () => {
    const obj = { a: { b: { c: 1 }, keep: true } };
    unset(obj, 'a.b.c');
    expect(obj).toEqual({ a: { keep: true } });
  });

  it('removes a root-level key', () => {
    const obj = { username: 'john' };
    unset(obj, 'username');
    expect(obj).toEqual({});
  });

  it('keeps the empty object in the array when its only property is removed', () => {
    const obj = { items: [{ name: 'Alice' }] };
    unset(obj, 'items.0.name');
    expect(obj).toEqual({ items: [{}] });
  });

  it('keeps the empty object in the array at its original index when siblings remain', () => {
    const obj = { items: [{ name: 'Alice' }, { name: 'Bob' }] };
    unset(obj, 'items.0.name');
    expect(obj).toEqual({ items: [{}, { name: 'Bob' }] });
  });

  it('is a no-op when the path does not exist', () => {
    const obj = { a: 1 };
    unset(obj, 'a.b.c');
    expect(obj).toEqual({ a: 1 });
  });

  it('returns the object unchanged when path is empty', () => {
    const obj = { a: 1 };
    unset(obj, '');
    expect(obj).toEqual({ a: 1 });
  });

  it('mutates and returns the original object reference', () => {
    const obj = { a: { b: 1 } };
    const result = unset(obj, 'a.b');
    expect(result).toBe(obj);
  });
});

describe('object.cloneObject', () => {
  it('returns primitives and null unchanged', () => {
    expect(cloneObject(42)).toBe(42);
    expect(cloneObject('hello')).toBe('hello');
    expect(cloneObject(true)).toBe(true);
    expect(cloneObject(null)).toBeNull();
    expect(cloneObject(undefined)).toBeUndefined();
  });

  it('deep-clones nested objects with separate references', () => {
    const source = { a: 1, b: { c: 2, d: [3, 4] } };
    const clone = cloneObject(source);
    expect(clone).toEqual(source);
    expect(clone).not.toBe(source);
    expect(clone.b).not.toBe(source.b);
    expect(clone.b.d).not.toBe(source.b.d);
  });

  it('deep-clones arrays', () => {
    const source = [{ a: 1 }, { a: 2 }];
    const clone = cloneObject(source);
    expect(clone).toEqual(source);
    expect(clone).not.toBe(source);
    expect(clone[0]).not.toBe(source[0]);
  });

  it('preserves function values by reference', () => {
    const fn = (x: number) => x + 1;
    const source = { handler: fn, nested: { callback: fn } };
    const clone = cloneObject(source);
    expect(clone.handler).toBe(fn);
    expect(clone.nested.callback).toBe(fn);
  });

  it('preserves functions nested inside arrays', () => {
    const fn = () => 'hi';
    const source = { items: [{ resolver: fn }] };
    const clone = cloneObject(source);
    expect(clone.items[0].resolver).toBe(fn);
    expect(clone.items).not.toBe(source.items);
  });
});
