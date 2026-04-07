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

/**
 * Resolves a dot-notation scope path to its underlying value using the
 * appropriate resolver based on the path prefix (`$form.*` or `$meta.*`).
 *
 * @param path - A dot-notation path starting with `$form.` or `$meta.`
 * @param resolvers.resolveFormScope - Resolves a path within the $form scope
 * @param resolvers.resolveMetaScope - Resolves a path within the $meta scope
 */
export const scopeResolver = (
  path: DotPath,
  resolvers: {
    resolveFormScope: (scopePath: DotPath) => any;
    resolveMetaScope: (scopePath: DotPath) => any;
  },
) => {
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
