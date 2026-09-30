/**
 * Turns a property name or an enum value into a label: `_` and `-` become spaces, camelCase is
 * split, and the first letter is upper case. The same rule as the earlier gui-mcp mapper, so
 * labels made from names do not change.
 *
 * @example
 * humanize('firstName') // 'First Name'
 * humanize('zip_code') // 'Zip code'
 * humanize('US') // 'US'
 */
export function humanize(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (first) => first.toUpperCase());
}
