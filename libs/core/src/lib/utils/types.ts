/**
 * LooseUnion<T> - Creates a string union that provides autocomplete while accepting any string.
 *
 * This utility type allows you to define a set of recommended string values that appear in
 * IDE autocomplete, while still accepting any arbitrary string value without type errors.
 * This is useful for APIs where you want to suggest common values but not restrict users.
 *
 * @example
 * // Define common HTTP methods with autocomplete, but allow custom methods
 * type HttpMethod = LooseUnion<"GET" | "POST" | "PUT" | "DELETE">;
 *
 * const method1: HttpMethod = "GET"; // Autocomplete suggests: GET, POST, PUT, DELETE
 * const method2: HttpMethod = "PATCH"; // Also accepts any other string
 *
 * @example
 * // CSS color names with autocomplete, but allow hex/rgb values
 * type Color = LooseUnion<"red" | "blue" | "green">;
 *
 * const color1: Color = "red"; // Autocomplete shows common colors
 * const color2: Color = "#ff0000"; // But also accepts custom values
 */
export type LooseUnion<T extends string> = T | (string & {});

/**
 * LooseObject<T> - Creates an object type with required properties that also accepts any additional properties.
 *
 * This utility type enforces specific required properties while allowing arbitrary additional
 * properties, providing autocomplete for the known properties without restricting extensibility.
 *
 * @example
 * type CustomValidator = LooseObject<{
 *   type: 'custom';
 *   validate: (value: any) => boolean;
 * }>;
 *
 * const validator: CustomValidator = {
 *   type: 'custom',
 *   validate: (v) => v > 0,
 *   // Can add any other properties
 *   message: 'Must be positive',
 *   code: 'POSITIVE_ONLY'
 * };
 */
export type LooseObject<T extends object> = T & Record<string, any>;

/**
 * Prettify<T> - Flattens and displays complex TypeScript types in a readable format.
 *
 * This utility type takes a complex type (especially unions of intersections) and
 * "expands" it in IDE tooltips and error messages, making it easier to see all
 * properties at once instead of seeing multiple intersected types.
 *
 * @example
 * type User = { id: number; name: string };
 * type Timestamps = { createdAt: Date; updatedAt: Date };
 *
 * // Without Prettify: IDE shows "User & Timestamps"
 * type UserWithTimestamps = User & Timestamps;
 *
 * // With Prettify: IDE shows the expanded type:
 * // { id: number; name: string; createdAt: Date; updatedAt: Date }
 * type PrettifiedUser = Prettify<User & Timestamps>;
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Recursively makes all properties of a type deeply immutable and read-only.
 *
 * @template T - The type to make immutable
 * @returns A type where:
 * - Arrays are converted to readonly arrays with immutable elements
 * - Objects have all properties converted to readonly with immutable values
 * - Primitive types remain unchanged
 *
 * @example
 * ```typescript
 * type User = { name: string; age: number; tags: string[] };
 * type ImmutableUser = ImmutableRecord<User>;
 * // Result: { readonly name: string; readonly age: number; readonly tags: readonly string[] }
 * ```
 */
export type ImmutableRecord<T> = T;
// TODO: use this one
export type _ImmutableRecord<T> = T extends (infer R)[]
  ? ReadonlyArray<ImmutableRecord<R>>
  : T extends object
    ? { readonly [P in keyof T]: ImmutableRecord<T[P]> }
    : T;
