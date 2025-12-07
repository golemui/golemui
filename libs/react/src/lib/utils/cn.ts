/**
 * Combines multiple class names into a single string, filtering out falsy values.
 *
 * Supports various input formats:
 * - Strings: included as-is
 * - Booleans: filtered out
 * - Arrays: recursively processed and joined with spaces
 * - Objects: keys with truthy values are included
 * - null/undefined: filtered out
 *
 * @param cns - Variable number of class name inputs (strings, booleans, arrays, or objects)
 * @returns A space-separated string of class names
 *
 * @example
 * cn('px-2', 'py-1') // 'px-2 py-1'
 * cn('px-2', false, undefined) // 'px-2'
 * cn(['px-2', true && 'py-1']) // 'px-2 py-1'
 * cn({ 'px-2': true, 'py-1': false }) // 'px-2'
 * cn('px-2', { 'py-1': true }, ['text-lg']) // 'px-2 py-1 text-lg'
 * cn(['foo', { bar: true, nope: undefined }, ['baz']]) // 'foo bar baz'
 *
 * @note This is an adaptation of https://github.com/lukeed/clsx
 */

export type CnValue = string | boolean | undefined | null;
export type CnRecord = Record<string, boolean | undefined | null>;
export type CnArray = Cn[];
export type Cn = CnRecord | CnValue | CnArray;

export const cn = (...cns: Cn[]): string => {
  let str = '';
  for (const item of cns) {
    const classNames = cnInternal(item);
    if (classNames.trim().length > 0) {
      if (str !== '') {
        str += ' ';
      }
      str += classNames;
    }
  }
  return str;
};

const cnInternal = (cns: Cn): string => {
  if (cns === undefined || cns === null) {
    return '';
  }

  if (typeof cns === 'string') {
    return cns;
  }

  if (typeof cns === 'boolean') {
    return '';
  }

  if (Array.isArray(cns)) {
    let str = '';
    for (const item of cns) {
      const classNames = cnInternal(item);
      if (classNames.trim().length > 0) {
        if (str !== '') {
          str += ' ';
        }
        str += classNames;
      }
    }
    return str;
  }

  if (typeof cns === 'object') {
    const parts: string[] = [];
    for (const key in cns) {
      if (Object.prototype.hasOwnProperty.call(cns, key)) {
        const val = (cns as CnRecord)[key];
        if (val) parts.push(key);
      }
    }
    return parts.join(' ');
  }

  return '';
};
