import { type FormWidget, isLayoutWidget } from '../form-widget';
import { type $Errors } from '../shared';
import { type State } from '../store/model';
import { set } from './object';

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
