import * as Widget from '../form-widget';

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

export function uidCollisionErrorMessage(
  existingWidget: Widget.FormWidget<string>,
  newWidget: Widget.FormWidget<string>,
) {
  const getPath = (f: Widget.FormWidget<string>) =>
    Widget.isInputWidget(f) ? ` at "${f.path}"` : '';
  return `Duplicate UID "${newWidget.uid}": Assigned to widget "${existingWidget.widget}"${getPath(existingWidget)} and "${newWidget.widget}"${getPath(newWidget)}.`;
}
