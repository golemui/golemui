import { DotPath } from '../shared';

/**
 * Retrieves a value from a nested object using a dot-separated path.
 *
 * This function safely navigates through nested objects and arrays using a dot notation
 * path string. It handles both object properties and array indices.
 *
 * @param obj - The object to retrieve the value from
 * @param path - A dot-separated string path to the desired value (e.g., "user.profile.name" or "items.0.title")
 * @returns The value at the specified path, or undefined if the path doesn't exist
 *
 * @example
 * Basic object navigation:
 * ```typescript
 * const user = { profile: { name: "John", age: 30 } };
 * get(user, "profile.name"); // Returns "John"
 * get(user, "profile.age");  // Returns 30
 * ```
 *
 * @example
 * Array access with indices:
 * ```typescript
 * const data = { users: [{ name: "Alice" }, { name: "Bob" }] };
 * get(data, "users.0.name"); // Returns "Alice"
 * get(data, "users.1.name"); // Returns "Bob"
 * ```
 *
 * @example
 * Mixed object and array navigation:
 * ```typescript
 * const complex = {
 *   teams: [
 *     { name: "Engineering", members: [{ role: "Lead" }, { role: "Dev" }] },
 *     { name: "Design", members: [{ role: "Senior" }] }
 *   ]
 * };
 * get(complex, "teams.0.name");           // Returns "Engineering"
 * get(complex, "teams.0.members.1.role"); // Returns "Dev"
 * ```
 *
 * @example
 * Handling non-existent paths:
 * ```typescript
 * const obj = { a: { b: "value" } };
 * get(obj, "a.b");     // Returns "value"
 * get(obj, "a.c");     // Returns undefined
 * get(obj, "x.y.z");   // Returns undefined
 * ```
 */
export const get = <T = any>(obj: Record<string, any>, path: DotPath): T => {
  if (obj === undefined) {
    throw new Error('obj is undefined');
  }

  return path.split('.').reduce((acc, prop) => {
    if (acc === undefined) {
      return acc;
    }

    if (prop === '') {
      return acc;
    }

    if (Array.isArray(acc)) {
      return acc[parseInt(prop, 10)];
    }

    return acc[prop];
  }, obj) as T;
};

/**
 * Sets the value at path of object by mutation.
 * If a portion of path doesn't exist, it's created.
 * Arrays are created for missing index properties while objects are created for all other missing properties.
 *
 * @param object - The object to modify
 * @param path - The path of the property to set (dot notation)
 * @param value - The value to set
 * @returns The modified object (mutates the original object)
 *
 * @example
 * Basic property setting:
 * ```typescript
 * const obj = { a: 1 };
 * set(obj, 'b', 2);
 * // Result: { a: 1, b: 2 }
 * ```
 *
 * @example
 * Nested property creation:
 * ```typescript
 * const obj = {};
 * set(obj, 'user.name', 'John');
 * // Result: { user: { name: 'John' } }
 * ```
 *
 * @example
 * Deep nested path creation:
 * ```typescript
 * const obj = {};
 * set(obj, 'config.api.endpoints.users', '/api/v1/users');
 * // Result: { config: { api: { endpoints: { users: '/api/v1/users' } } } }
 * ```
 *
 * @example
 * Array index creation:
 * ```typescript
 * const obj = {};
 * set(obj, 'items.0', 'first item');
 * set(obj, 'items.2', 'third item');
 * // Result: { items: ['first item', undefined, 'third item'] }
 * ```
 *
 * @example
 * Mixed object and array paths:
 * ```typescript
 * const obj = {};
 * set(obj, 'users.0.name', 'Alice');
 * set(obj, 'users.0.age', 25);
 * set(obj, 'users.1.name', 'Bob');
 * // Result: { users: [{ name: 'Alice', age: 25 }, { name: 'Bob' }] }
 * ```
 *
 * @example
 * Overwriting existing values:
 * ```typescript
 * const obj = { user: { name: 'John', age: 30 } };
 * set(obj, 'user.name', 'Jane');
 * set(obj, 'user.email', 'jane@example.com');
 * // Result: { user: { name: 'Jane', age: 30, email: 'jane@example.com' } }
 * ```
 *
 * @example
 * Working with existing arrays:
 * ```typescript
 * const obj = { items: ['a', 'b'] };
 * set(obj, 'items.5', 'f');
 * // Result: { items: ['a', 'b', undefined, undefined, undefined, 'f'] }
 * ```
 */
export const set = (object: Record<string, any>, path: DotPath, value: any) => {
  if (object === null) {
    throw new Error('object is null');
  }
  if (object === undefined) {
    throw new Error('object is undefined');
  }
  if (path === '') {
    throw new Error('path cannot be empty');
  }

  const pathArray = path.split('.');

  let current = object;
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    const nextKey = pathArray[i + 1];

    // If the current key doesn't exist or isn't an object/array
    if (current[key] == null || typeof current[key] !== 'object') {
      // Create array if next key is numeric, otherwise create object
      current[key] = isIndex(nextKey) ? [] : {};
    }

    current = current[key];
  }

  // Set the final value
  const lastKey = pathArray[pathArray.length - 1];
  current[lastKey] = value;

  return object;
};

function isIndex(value: string) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 && num.toString() === value;
}

/**
 * Deletes a key from an object and returns the same mutated object.
 *
 * @param object - The object to remove the key from.
 * @param key - The property name to delete.
 * @returns The same object, with the specified key removed.
 *
 * @example
 * ```ts
 * const obj = { a: 1, b: 2, c: 3 };
 * deleteKey(obj, "b");
 * console.log(obj); // { a: 1, c: 3 }
 * ```
 */
export const deleteKey = (object: Record<string, any>, key: string) => {
  delete object[key];
  return object;
};
