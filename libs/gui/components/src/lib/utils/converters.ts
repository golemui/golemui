import type { ComplexAttributeConverter } from 'lit';

/**
 * The converter of every boolean property of the elements. A boolean attribute that can also be
 * turned off from HTML: present means `true`, except `"false"`, and absent means `undefined`,
 * which leaves the property's default in charge. A plain Lit boolean attribute can only be turned
 * on (`allow-duplicates="false"` would still be `true`), and a string one reads `value="false"` as
 * a truthy string. A reflected property writes an empty attribute for `true` and removes it
 * otherwise.
 */
export const booleanAttribute: ComplexAttributeConverter<boolean | undefined> = {
  fromAttribute: (value: string | null) => (value === null ? undefined : value !== 'false'),
  toAttribute: (value: boolean | undefined) => (value ? '' : null),
};
