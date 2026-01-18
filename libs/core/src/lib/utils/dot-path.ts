import { DotPath } from '../shared';
import { pipe } from './function';
import { toCapitalizedWords } from './string';

export const toLabel = (path: string): string => {
  if (path === '') {
    return '';
  }
  return pipe(path.split('.').pop() as string, toCapitalizedWords);
};

// TODO: Add explicit checks for $form, $error and $meta prefixes
/**
 * Heuristically checks if a value looks like a dot notation path
 * rather than a standard string.
 * * To be considered a "potential" dot path, the value must:
 * 1. Be a string.
 * 2. Contain at least one dot (`.`) separator.
 * 3. Not contain any spaces (distinguishing it from sentences).
 *
 * * @example
 * isPotentialDotPath('$form.user.id');   // true  (Has dot, no space)
 * isPotentialDotPath('name');      // false (Just a common string/key)
 * isPotentialDotPath('my file');   // false (Contains space)
 * isPotentialDotPath(123);         // false (Not a string)
 */
export const isPotentialDotPath = (path: unknown): path is DotPath => {
  return (
    typeof path === 'string' &&
    path.length > 1 && // Must be longer than just "."
    // path.includes('.') && // TODO: Activate when adding support for $form, $error, $meta prefixes
    !path.includes(' ')
  );
};
