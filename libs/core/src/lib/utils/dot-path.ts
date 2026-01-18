import { DotPath } from '../shared';
import { pipe } from './function';
import { toCapitalizedWords } from './string';

export const toLabel = (path: string): string => {
  if (path === '') {
    return '';
  }
  return pipe(path.split('.').pop() as string, toCapitalizedWords);
};

/**
 * Heuristically checks if a value looks like a dot notation path
 * rather than a standard string.
 * To be considered a "potential" dot path, the value must:
 * 1. Be a string.
 * 2. Start with one of the allowed prefixes ($form.*, $error.* or $meta.*).
 * 3. Not contain any spaces (distinguishing it from sentences).
 *
 * * @example
 * isPotentialDotPath('$form.user.id');   // true
 * isPotentialDotPath('name');      // false (No prefix)
 * isPotentialDotPath('my file');   // false (Contains space)
 * isPotentialDotPath(123);         // false (Not a string)
 */
export const isPotentialDotPath = (path: unknown): path is DotPath => {
  return (
    typeof path === 'string' &&
    !path.includes(' ') &&
    (path.startsWith('$form.') || path.startsWith('$error.') || path.startsWith('$meta.'))
  );
};
