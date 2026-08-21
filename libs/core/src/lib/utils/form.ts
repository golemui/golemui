import { type FormWidget, isFunctionWidget, isInputWidget, isLayoutWidget } from '../form-widget';
import { type $Errors, type DotPath } from '../shared';
import { type State } from '../store/model';
import { cloneObject, set, unset } from './object';

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
 */
export function calculateValidationVariables(state: State): ValidationVariables {
  const result = Object.entries(state.validations).reduce(
    (acc, [dotPath, errors]) => {
      if (errors !== null) {
        acc.$formIsInvalid = true;
        // Copy the array so `set` can't mutate the entry shared with state.validations
        // when a nested path (e.g. `users.1.firstName`) walks through this one (`users`).
        set(acc.$errors, dotPath, [...errors]);
      }
      return acc;
    },
    { $formIsInvalid: false, $errors: {} },
  );
  return result;
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
 */
export function pruneHiddenData(state: State): Record<string, any> {
  const pruned = cloneObject(state.data);

  for (const [uid, flags] of Object.entries(state.widgetFlags)) {
    if (flags.hidden === true) {
      const path = inputPath(state.resolvedSources[uid]);
      if (path !== undefined) {
        unset(pruned, path);
      }
    }
  }

  return pruned;
}
