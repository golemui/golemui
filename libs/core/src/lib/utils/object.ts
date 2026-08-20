import { type DotPath } from '../shared';

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
 * Tells whether every segment of a dot-separated path is present in the object.
 *
 * Unlike `get`, a leaf that is present but holds `undefined` counts as existing, which is
 * what distinguishes "the value was never written" from "the value was cleared".
 *
 * @param object - The object to look the path up in
 * @param path - A dot-separated path (e.g. "user.profile.name" or "users.0.name").
 *   An empty path returns false.
 * @returns True when every segment exists, false otherwise
 *
 * @example
 * ```typescript
 * pathExists({ user: { name: undefined } }, 'user.name'); // true
 * pathExists({ user: {} }, 'user.name');                  // false
 * pathExists({ users: [{ name: 'Alice' }] }, 'users.1');  // false
 * ```
 */
export const pathExists = (object: Record<string, any>, path: DotPath): boolean => {
  if (path === '') {
    return false;
  }

  let current: any = object;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') {
      return false;
    }
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (!(index in current)) {
        return false;
      }
      current = current[index];
    } else {
      if (!(segment in current)) {
        return false;
      }
      current = current[segment];
    }
  }
  return true;
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

/**
 * Returns a copy of `object` with `value` set at `path`, copying only the containers along
 * the path. Untouched siblings keep their references and `object` is never modified, so the
 * result can be compared to the input by reference at any level. Missing containers are
 * created like {@link set}: an array when the next key is an index, an object otherwise.
 * @param object - The object to copy and write into.
 * @param path - Dot-separated path, array indexes as numeric segments.
 * @param value - The value to set at the path.
 * @returns A new root object with the value set.
 * @example
 * const next = copyOnWriteSet({ a: { b: 1 }, c: { d: 2 } }, 'a.b', 3);
 * next.a.b;           // 3
 * next.c;             // the input's c, by reference
 */
export const copyOnWriteSet = (
  object: Record<string, any>,
  path: DotPath,
  value: any,
): Record<string, any> => {
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
  const root = copyContainer(object);

  let current = root;
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i];
    const nextKey = pathArray[i + 1];

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = isIndex(nextKey) ? [] : {};
    } else {
      current[key] = copyContainer(current[key]);
    }

    current = current[key];
  }

  current[pathArray[pathArray.length - 1]] = value;
  return root;
};

// `slice` keeps array holes, a spread would turn them into own `undefined` entries and
// `pathExists` would then report a hole as an existing path.
const copyContainer = (container: any): any =>
  Array.isArray(container) ? container.slice() : { ...container };

/**
 * Removes the property at the given dot-path from object by mutation.
 * After deletion, any ancestor plain objects that become empty are also removed.
 * Ancestor arrays that become empty are left in place, upward pruning stops as
 * soon as an array boundary is encountered.
 *
 * @param object - The object to modify
 * @param path - The dot-separated path of the property to remove (e.g. "user.profile.name").
 *   Pass an empty string to return the object unchanged.
 * @returns The modified object (mutates the original object). Returns unchanged if path is
 *   empty or does not exist.
 *
 * @example
 * Basic property removal with sibling preserved:
 * ```typescript
 * const obj = { user: { name: 'John', age: 30 } };
 * unset(obj, 'user.name');
 * // Result: { user: { age: 30 } }
 * ```
 *
 * @example
 * Recursive pruning of empty ancestors:
 * ```typescript
 * const obj = { a: { b: { c: 1 } } };
 * unset(obj, 'a.b.c');
 * // Result: {} ('b' and 'a' are pruned because they became empty objects)
 * ```
 *
 * @example
 * Pruning stops at array boundaries:
 * ```typescript
 * const obj = { items: [{ name: 'Alice' }] };
 * unset(obj, 'items.0.name');
 * // Result: { items: [{}] } (the empty object is kept inside the array)
 * ```
 */
export const unset = <T extends Record<string, any>>(object: T, path: DotPath): T => {
  if (path === '') {
    return object;
  }

  const segments = path.split('.');
  const containers: Array<any> = [object];

  // Collect each intermediate container along the path
  for (let i = 0; i < segments.length - 1; i++) {
    const current = containers[i];
    if (current === null || current === undefined || typeof current !== 'object') {
      return object;
    }
    const segment = segments[i];
    const next = Array.isArray(current) ? current[parseInt(segment, 10)] : current[segment];
    if (next === null || next === undefined || typeof next !== 'object') {
      return object;
    }
    containers.push(next);
  }

  // Delete the target property from its direct container
  const targetContainer = containers[containers.length - 1];
  const targetSegment = segments[segments.length - 1];
  if (Array.isArray(targetContainer)) {
    targetContainer.splice(parseInt(targetSegment, 10), 1);
  } else {
    delete targetContainer[targetSegment];
  }

  // Walk up, pruning ancestor plain objects that became empty.
  // Stop when hitting a non-empty container or an array.
  for (let i = containers.length - 1; i >= 1; i--) {
    const child = containers[i];
    if (Array.isArray(child) || !isEmptyPlainObject(child)) {
      break;
    }
    const parent = containers[i - 1];
    const segment = segments[i - 1];
    if (Array.isArray(parent)) {
      break;
    } else {
      delete parent[segment];
    }
  }

  return object;
};

function isIndex(value: string) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0 && num.toString() === value;
}

function isEmptyPlainObject(value: any): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

/**
 * Deep-clones plain objects and arrays while preserving function references
 * (and other non-plain values) by reference. Functions are stateless widget
 * resolvers and only need to survive the trip into repeater item configs.
 */
export function cloneObject<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneObject(item)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    out[key] = cloneObject((value as Record<string, unknown>)[key]);
  }
  return out as T;
}
