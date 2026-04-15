import * as Widget from '../form-widget';
import { $Errors, DotPath } from '../shared';
import { State } from '../store/model';
import { set } from './object';

/**
 * Expression Scopes define the root namespaces accessible within
 * reactive expressions and template strings.
 */
export const EXPRESSION_SCOPE = {
  FORM: '$form',
  META: '$meta',
  ERRORS: '$errors',
  FORM_IS_INVALID: '$formIsInvalid',
} as const;

/**
 * Heuristically checks if a value looks like a scoped path
 * rather than a standard string.
 * To be considered a "potential" scoped path, the value must:
 * 1. Be a string.
 * 2. Start with one of the allowed prefixes ($form.*, $meta.*, etc..).
 * 3. Not contain any spaces (distinguishing it from sentences).
 *
 * * @example
 * isPotentialScopedPath('$form.user.id');  // true
 * isPotentialScopedPath('name');           // false (No prefix)
 * isPotentialScopedPath('my file');        // false (Contains space)
 * isPotentialScopedPath(123);              // false (Not a string)
 */
export const isPotentialScopedPath = (path: unknown): path is DotPath => {
  return (
    typeof path === 'string' &&
    !path.includes(' ') &&
    (path.startsWith(`${EXPRESSION_SCOPE.FORM}.`) ||
      path.startsWith(`${EXPRESSION_SCOPE.META}.`) ||
      path.startsWith(`${EXPRESSION_SCOPE.ERRORS}.`) ||
      path === EXPRESSION_SCOPE.FORM_IS_INVALID)
  );
};

export interface ScopedPathResolvers {
  resolveFormPath: (expr: string) => any;
  resolveMetaPath: (expr: string) => any;
  resolveErrorsPath: (expr: string) => any;
  resolveFormIsInvalid: () => string | boolean;
}

const dottedScopePattern = [EXPRESSION_SCOPE.FORM, EXPRESSION_SCOPE.META, EXPRESSION_SCOPE.ERRORS]
  .map((s) => s.replace('$', '\\$'))
  .join('|');

/**
 * Matches scoped path placeholders in template strings.
 * Capture groups:
 *   scope    — full scope including $, e.g. '$form', '$meta', '$errors'
 *   path     — property path after the dot, e.g. 'user.id'
 *   isInvalid — the literal '$formIsInvalid'
 */
const SCOPED_PATH_TEMPLATE_REGEX = new RegExp(
  `\\{\\{(?:(?<scope>${dottedScopePattern})\\.(?<path>[^}]+)|(?<isInvalid>\\${EXPRESSION_SCOPE.FORM_IS_INVALID}))\\}\\}`,
  'g',
);

/**
 * Resolves all scoped path placeholders within a string in a single pass.
 * e.g. "User {{ $form.name }} has status {{ $meta.status }} or {{ $formIsInvalid }}"
 *
 * @param input - The template string to process
 * @param resolvers - Implementation of value resolution logic
 * @returns The string with all valid placeholders replaced by their resolved values
 */
export const resolveScopedPaths = (input: string, resolvers: ScopedPathResolvers): string => {
  if (typeof input !== 'string') {
    return input;
  }

  // Fast-path: If no trigger is found, avoid the regex engine entirely.
  if (!input.includes('{{$')) {
    return input;
  }

  return input.replace(SCOPED_PATH_TEMPLATE_REGEX, (match, ...args) => {
    // The last argument is the 'groups' object if named groups are used
    const groups = args[args.length - 1] as {
      scope?: '$form' | '$meta' | '$errors';
      path?: string;
      isInvalid?: string;
    };

    const { scope, path, isInvalid } = groups;

    try {
      if (isInvalid === EXPRESSION_SCOPE.FORM_IS_INVALID) {
        return resolvers.resolveFormIsInvalid();
      }

      if (scope && path) {
        switch (scope) {
          case EXPRESSION_SCOPE.FORM:
            return resolvers.resolveFormPath(path);
          case EXPRESSION_SCOPE.META:
            return resolvers.resolveMetaPath(path);
          case EXPRESSION_SCOPE.ERRORS:
            return resolvers.resolveErrorsPath(path);
          default:
            return match;
        }
      }
    } catch (err) {
      console.error(`Error resolving Expression: '${input}'`, err);
      return match;
    }

    return match;
  });
};

/**
 * Resolves a scoped path to its underlying value using the
 * appropriate resolver based on the path prefix (`$form.*`, `$meta.*`, `$errors.*` or `$formIsInvalid`).
 *
 * @param variable - A dot-notation path starting with `$form.`, `$meta.` or `$errors.`, or `$formIsInvalid`.
 * @param resolvers.resolveFormPath - Resolves a path within the $form scope
 * @param resolvers.resolveMetaPath - Resolves a path within the $meta scope
 */
export const resolveScopedPath = (variable: string, resolvers: ScopedPathResolvers) => {
  const formPrefix = `${EXPRESSION_SCOPE.FORM}.`;
  if (variable.startsWith(formPrefix)) {
    return resolvers.resolveFormPath(variable.replace(formPrefix, ''));
  }
  const metaPrefix = `${EXPRESSION_SCOPE.META}.`;
  if (variable.startsWith(metaPrefix)) {
    return resolvers.resolveMetaPath(variable.replace(metaPrefix, ''));
  }
  const errorsPrefix = `${EXPRESSION_SCOPE.ERRORS}.`;
  if (variable.startsWith(errorsPrefix)) {
    return resolvers.resolveErrorsPath(variable.replace(errorsPrefix, ''));
  }
  if (variable === EXPRESSION_SCOPE.FORM_IS_INVALID) {
    return resolvers.resolveFormIsInvalid();
  }
  return undefined;
};

/**
 * Flattens the hierarchical form structure into a single-level array of form widgets.
 *
 * @returns A flattened array of all form widgets, including nested ones from layout widgets
 *
 * @example
 * ```typescript
 * const hierarchicalWidgets = [
 *   { type: 'text', name: 'firstName' },
 *   { type: 'layout', children: [
 *     { type: 'text', name: 'street' },
 *     { type: 'text', name: 'city' }
 *   ]}
 * ];
 * const flatWidgets = flattenForm(hierarchicalWidgets);
 * // Result: [firstName, layout, street, city]
 * ```
 */
export function flattenForm(widgets: Widget.FormWidget[]): Widget.FormWidget[] {
  return widgets.flatMap((widget) => [
    widget,
    ...(Widget.isLayoutWidget(widget) ? flattenForm(widget.children) : []),
  ]);
}

/**
 * Calculates validation variables to be used in reactive expressions
 * e.g. `{ invalidAge: '!!$errors.age' }` or { disabled { when: '$formIsInvalid' } }
 */
export function calculateValidationVariables(state: State): {
  $formIsInvalid: boolean;
  $errors: $Errors;
} {
  const result = Object.entries(state.validations).reduce(
    (acc, [dotPath, errors]) => {
      if (errors !== null) {
        acc.$formIsInvalid = true;
        set(acc.$errors, dotPath, errors);
      }
      return acc;
    },
    { $formIsInvalid: false, $errors: {} },
  );
  return result;
}
