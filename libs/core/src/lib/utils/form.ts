import * as Widget from '../form-widget';
import { DotPath } from '../shared';

/**
 * Heuristically checks if a value looks like a dot notation path
 * rather than a standard string.
 * To be considered a "potential" dot path, the value must:
 * 1. Be a string.
 * 2. Start with one of the allowed prefixes ($form.* or $meta.*).
 * 3. Not contain any spaces (distinguishing it from sentences).
 *
 * * @example
 * isPotentialScopePath('$form.user.id');   // true
 * isPotentialScopePath('name');      // false (No prefix)
 * isPotentialScopePath('my file');   // false (Contains space)
 * isPotentialScopePath(123);         // false (Not a string)
 */
export const isPotentialScopePath = (path: unknown): path is DotPath => {
  return (
    typeof path === 'string' &&
    !path.includes(' ') &&
    (path.startsWith('$form.') || path.startsWith('$meta.'))
  );
};

export interface ScopeResolvers {
  resolveFormScope: (path: DotPath) => any;
  resolveMetaScope: (path: DotPath) => any;
}

/**
 * Resolves all scope path placeholders within a string in a single pass.
 * e.g. "User {{ $form.name }} has status {{ $meta.status }}"
 *
 * @returns The string with all valid placeholders replaced by their resolved values
 */
export const resolveScopePaths = (input: string, resolvers: ScopeResolvers): string => {
  if (typeof input !== 'string') {
    return input;
  }

  // Fast-path: If no trigger is found, avoid the regex engine entirely.
  if (!input.includes('{{$')) {
    return input;
  }

  const SCOPE_RESOLVER_REGEX = /\{\{\$(form|meta)\.([^}]+)\}\}/g;

  /**
   * match: The full "{{$form.path}}"
   * scope: The first capture group (form|meta)
   * path: The second capture group ([^}]+)
   */
  return input.replace(SCOPE_RESOLVER_REGEX, (match, scope, path) => {
    try {
      if (scope === 'form') {
        return resolvers.resolveFormScope(path);
      }
      if (scope === 'meta') {
        return resolvers.resolveMetaScope(path);
      }
    } catch {
      return match;
    }
    return match;
  });
};

/**
 * Resolves a dot-notation scope path to its underlying value using the
 * appropriate resolver based on the path prefix (`$form.*` or `$meta.*`).
 *
 * @param path - A dot-notation path starting with `$form.` or `$meta.`
 * @param resolvers.resolveFormScope - Resolves a path within the $form scope
 * @param resolvers.resolveMetaScope - Resolves a path within the $meta scope
 */
export const scopeResolver = (path: DotPath, resolvers: ScopeResolvers) => {
  if (path.startsWith('$form.')) {
    const pathWithout$form = path.replace('$form.', '');
    return resolvers.resolveFormScope(pathWithout$form);
  }
  if (path.startsWith('$meta.')) {
    const pathWithout$meta = path.replace('$meta.', '');
    return resolvers.resolveMetaScope(pathWithout$meta);
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
