import { type FormWidget, isFunctionWidget, isInputWidget, isLayoutWidget } from '../form-widget';
import { type $Errors, type DotPath } from '../shared';
import { type State } from '../store/model';
import { cloneObject, isPlainObject, set, unset } from './object';

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
export function flattenForm(widgets: FormWidget[]): FormWidget[] {
  return widgets.flatMap((widget) => [
    widget,
    ...(isLayoutWidget(widget) ? flattenForm(widget.children) : []),
  ]);
}

/**
 * The validation variables reactive expressions can read.
 */
export type ValidationVariables = {
  $formIsInvalid: boolean;
  $errors: $Errors;
};

/**
 * Calculates validation variables to be used in reactive expressions
 * e.g. `{ invalidAge: '!!$errors.age' }` or { disabled { when: '$formIsInvalid' } }
 * An error counts only when a visible input owns its path. The entry of a hidden input stays in
 * `state.validations` until the next validation, and counts again if the input is shown before it.
 */
export function calculateValidationVariables(state: State): ValidationVariables {
  const failing = Object.entries(state.validations).filter(
    (entry): entry is [DotPath, string[]] => entry[1] !== null,
  );
  if (failing.length === 0) {
    return { $formIsInvalid: false, $errors: {} };
  }

  const visiblePaths = visibleInputPaths(state);
  // Shallow paths first, so a container written before its descendants makes the collision below
  // deterministic instead of dependent on widget order.
  const byDepth = failing
    .filter(([dotPath]) => visiblePaths.has(dotPath))
    .sort(([a], [b]) => a.split('.').length - b.split('.').length);
  const result = byDepth.reduce(
    (acc, [dotPath, errors]) => {
      acc.$formIsInvalid = true;
      // Copy the array so `set` can't mutate the entry shared with state.validations
      // when a nested path (e.g. `users.1.firstName`) walks through this one (`users`).
      // Known limit: when both `users` and `users.1.firstName` have errors, the nested write
      // replaces element 1 of the container's array. One slot cannot hold both a message and a
      // child object, so fixing it means changing the public `$errors` shape.
      set(acc.$errors, dotPath, [...errors]);
      return acc;
    },
    { $formIsInvalid: false, $errors: {} },
  );
  return result;
}

/**
 * Collects the paths that at least one visible input owns. Two inputs can own the same path, so
 * a hidden input does not remove a path that another input shows.
 *
 * @param state - The form state, with `resolvedSources` and the `widgetFlags` to read.
 * @returns The paths of the visible inputs.
 */
export function visibleInputPaths(state: State): Set<DotPath> {
  const paths = new Set<DotPath>();
  for (const [uid, widget] of Object.entries(state.resolvedSources)) {
    const path = inputPath(widget);
    if (path !== undefined && state.widgetFlags[uid]?.hidden !== true) {
      paths.add(path);
    }
  }
  return paths;
}

/**
 * The data path a widget owns: an input widget's `path`, or a function widget's `path` when it
 * returns a control. A function widget is stored as the callable itself, so `isInputWidget` is
 * false for it and its path is the one the decoder stamped on the function object.
 *
 * @param widget - A `resolvedSources` entry, or a `calculatedWidgets` `current` / `source`.
 * @returns The path, or `undefined` for a widget that owns none.
 */
export function inputPath(widget: FormWidget<string> | undefined): DotPath | undefined {
  if (widget === undefined) {
    return undefined;
  }
  return isInputWidget(widget) || isFunctionWidget(widget) ? widget.path : undefined;
}

/**
 * Returns a copy of the form data with values for currently-hidden input widgets removed.
 * Paths come from `resolvedSources`, so hidden repeater row inputs are pruned too and hidden
 * widgets absent from calculatedWidgets are still covered.
 * A hidden row of plain values leaves an empty slot at its index, so a row index in the pruned
 * data names the same row as in the form.
 * A hidden path stays when a visible input has the same path, a path below it, or a path above
 * it. A hidden row of a visible repeater is still removed.
 */
export function pruneHiddenData(state: State): Record<string, any> {
  const pruned = cloneObject(state.data);

  const hiddenInputs: { uid: string; path: DotPath }[] = [];
  const visiblePaths = new Set<DotPath>();
  const pathsAboveVisiblePaths = new Set<DotPath>();
  for (const [uid, widget] of Object.entries(state.resolvedSources)) {
    const path = inputPath(widget);
    if (path === undefined) {
      continue;
    }
    if (state.widgetFlags[uid]?.hidden === true) {
      hiddenInputs.push({ uid, path });
    } else {
      visiblePaths.add(path);
      for (const pathAbove of pathsAbove(path)) {
        pathsAboveVisiblePaths.add(pathAbove);
      }
    }
  }

  for (const { uid, path } of hiddenInputs) {
    if (visiblePaths.has(path) || pathsAboveVisiblePaths.has(path)) {
      continue;
    }
    const rowItemPath = state.repeaterItemScopes[uid]?.itemPath;
    const isBelowVisibleValue = pathsAbove(path).some(
      (pathAbove) =>
        visiblePaths.has(pathAbove) &&
        // A visible repeater does not keep its hidden rows.
        !(rowItemPath !== undefined && rowItemPath.startsWith(`${pathAbove}.`)),
    );
    if (isBelowVisibleValue || !isInsideCopiedContainers(pruned, path)) {
      continue;
    }
    unset(pruned, path);
  }

  return pruned;
}

/** `pathsAbove('a.b.c')` is `['a', 'a.b']`. */
function pathsAbove(path: DotPath): DotPath[] {
  const segments = path.split('.');
  const result: DotPath[] = [];
  for (let length = 1; length < segments.length; length++) {
    result.push(segments.slice(0, length).join('.'));
  }
  return result;
}

// `cloneObject` keeps a `Date` or a class instance as the same object. A delete inside it would
// change the form state and the object of the app.
function isInsideCopiedContainers(data: Record<string, any>, path: DotPath): boolean {
  let current: unknown = data;
  for (const segment of path.split('.').slice(0, -1)) {
    if (!Array.isArray(current) && !isPlainObject(current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return Array.isArray(current) || isPlainObject(current);
}
