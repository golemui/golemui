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
