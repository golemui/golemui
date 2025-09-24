import * as Field from '../../Field';
import { State } from '../model';

// TODO: Don't allow include.in and exclude.from at the same time
export const applyCurrentState = (state: State): State => {
  const fieldFlags = state.flatForm
    .filter((field) => {
      if (field.include && 'in' in field.include) {
        return true;
      }
      if (field.exclude && 'from' in field.exclude) {
        return true;
      }
      return false;
    })
    .reduce(
      (acc, field) => {
        acc[field.uid] = acc[field.uid] || {};
        if (field.include && 'in' in field.include) {
          acc[field.uid].hidden = !field.include.in.includes(
            state.currentState,
          );
        }
        if (field.exclude && 'from' in field.exclude) {
          acc[field.uid].hidden = field.exclude.from.includes(
            state.currentState,
          );
        }
        return acc;
      },
      {} as State['fieldFlags'],
    );
  const formLayoutChildren = calculateForm(
    state.formDef.form.children,
    fieldFlags,
  );
  const calculatedForm = {
    ...state.formDef.form,
    children: formLayoutChildren,
  };
  return {
    ...state,
    fieldFlags,
    calculatedForm,
  };
};

function calculateForm(
  fields: Field.FormField[],
  fieldFlags: State['fieldFlags'],
) {
  const acc: Field.FormField[] = [];
  fields.forEach((field) => {
    if (field.uid in fieldFlags && fieldFlags[field.uid].hidden) {
      // skip
    } else {
      if (Field.isLayoutField(field)) {
        field.children = calculateForm(field.children, fieldFlags);
      }
      acc.push(field);
    }
  });
  return acc;
}
