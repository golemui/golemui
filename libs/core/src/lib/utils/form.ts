import * as Field from '../form-field';

/**
 * Flattens the hierarchical form structure into a single-level array of form fields.
 *
 * @returns A flattened array of all form fields, including nested ones from layout fields
 *
 * @example
 * ```typescript
 * const hierarchicalFields = [
 *   { type: 'text', name: 'firstName' },
 *   { type: 'layout', children: [
 *     { type: 'text', name: 'street' },
 *     { type: 'text', name: 'city' }
 *   ]}
 * ];
 * const flatFields = flattenForm(hierarchicalFields);
 * // Result: [firstName field, layout field, street field, city field]
 * ```
 */
export function flattenForm(fields: Field.FormField[]): Field.FormField[] {
  return fields.flatMap((field) => [
    field,
    ...(Field.isLayoutField(field) ? flattenForm(field.children) : []),
  ]);
}

export function uidCollisionErrorMessage(
  existingField: Field.FormField<string>,
  newField: Field.FormField<string>,
) {
  const getPath = (f: Field.FormField<string>) =>
    Field.isControlField(f) ? ` at "${f.path}"` : '';
  return `Duplicate UID "${newField.uid}": Assigned to widget "${existingField.widget}"${getPath(existingField)} and "${newField.widget}"${getPath(newField)}.`;
}
