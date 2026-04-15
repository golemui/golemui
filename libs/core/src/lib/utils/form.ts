import * as Widget from '../form-widget';
import { $Errors, DotPath } from '../shared';
import { State } from '../store/model';
import { set } from './object';

// TODO: use this instead of harcoded strings everywhere we ref. scopes
export const EXPR_SCOPE = {
  $form: '$form',
  $meta: '$meta',
  $errors: '$errors',
  $formIsInvalid: '$formIsInvalid',
};

/**
 * Heuristically checks if a value looks like an expression variable
 * rather than a standard string.
 * To be considered a "potential" dot path, the value must:
 * 1. Be a string.
 * 2. Start with one of the allowed prefixes ($form.* or $meta.*).
 * 3. Not contain any spaces (distinguishing it from sentences).
 *
 * * @example
 * isPotentialExprVar('$form.user.id');  // true
 * isPotentialExprVar('name');           // false (No prefix)
 * isPotentialExprVar('my file');        // false (Contains space)
 * isPotentialExprVar(123);              // false (Not a string)
 */
export const isPotentialExprVar = (path: unknown): path is DotPath => {
  return (
    typeof path === 'string' &&
    !path.includes(' ') &&
    (path.startsWith('$form.') ||
      path.startsWith('$meta.') ||
      path.startsWith('$errors.') ||
      path === '$formIsInvalid')
  );
};

export interface ExprVarResolvers {
  resolveFormVar: (expr: string) => any;
  resolveMetaVar: (expr: string) => any;
  resolveErrorsVar: (expr: string) => any;
  resolveFormIsInvalidVar: () => string | boolean;
}

/**
 * Resolves all scope path placeholders within a string in a single pass.
 * e.g. "User {{ $form.name }} has status {{ $meta.status }} or {{ $formIsInvalid }}"
 *
 * @param input - The template string to process
 * @param resolvers - Implementation of value resolution logic
 * @returns The string with all valid placeholders replaced by their resolved values
 */
export const resolveExprVars = (input: string, resolvers: ExprVarResolvers): string => {
  if (typeof input !== 'string') {
    return input;
  }

  // Fast-path: If no trigger is found, avoid the regex engine entirely.
  if (!input.includes('{{$')) {
    return input;
  }

  /**
   * Named Capture Group Regex:
   * 1. scope: captures 'form', 'meta', or 'errors'
   * 2. path: captures the property path after the dot
   * 3. isInvalid: captures the literal '$formIsInvalid'
   */
  const EXPR_VAR_RESOLVER_REGEX =
    /\{\{(?:\$(?<scope>form|meta|errors)\.(?<path>[^}]+)|(?<isInvalid>\$formIsInvalid))\}\}/g;

  return input.replace(EXPR_VAR_RESOLVER_REGEX, (match, ...args) => {
    // The last argument is the 'groups' object if named groups are used
    const groups = args[args.length - 1] as {
      scope?: 'form' | 'meta' | 'errors';
      path?: string;
      isInvalid?: string;
    };

    const { scope, path, isInvalid } = groups;

    try {
      if (isInvalid === '$formIsInvalid') {
        return resolvers.resolveFormIsInvalidVar();
      }

      if (scope && path) {
        switch (scope) {
          case 'form':
            return resolvers.resolveFormVar(path);
          case 'meta':
            return resolvers.resolveMetaVar(path);
          case 'errors':
            return resolvers.resolveErrorsVar(path);
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
 * Resolves an expression variable to its underlying value using the
 * appropriate resolver based on the path prefix (`$form.*`, `$meta.*`, `$errors.*` or , `$forIsInvalid`).
 *
 * @param variable - A dot-notation path starting with `$form.`, `$meta.` or `$errors.`, or `$forIsInvalid`.
 * @param resolvers.resolveFormVar - Resolves a path within the $form scope
 * @param resolvers.resolveMetaVar - Resolves a path within the $meta scope
 */
export const exprVarResolver = (variable: string, resolvers: ExprVarResolvers) => {
  if (variable.startsWith('$form.')) {
    const pathWithout$form = variable.replace('$form.', '');
    return resolvers.resolveFormVar(pathWithout$form);
  }
  if (variable.startsWith('$meta.')) {
    const pathWithout$meta = variable.replace('$meta.', '');
    return resolvers.resolveMetaVar(pathWithout$meta);
  }
  if (variable.startsWith('$errors.')) {
    const pathWithout$errors = variable.replace('$errors.', '');
    return resolvers.resolveErrorsVar(pathWithout$errors);
  }
  if (variable === '$formIsInvalid') {
    return resolvers.resolveFormIsInvalidVar();
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
