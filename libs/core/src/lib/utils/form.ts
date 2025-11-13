import * as Field from '../FormField';

export function flattenForm(fields: Field.FormField[]): Field.FormField[] {
  return fields.flatMap((field) => [
    field,
    ...(Field.isLayoutField(field) ? flattenForm(field.children) : []),
  ]);
}
