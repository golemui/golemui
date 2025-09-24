import * as Field from '../../Field';
import { State } from '../model';

// TODO: Should we allow include.in and exclude.from at the same time?
export const applyCurrentState = (state: State): State => {
  const fieldFlags = calculateFieldFlags(state);

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

function calculateFieldFlags(state: State) {
  return state.flatForm
    .filter((field) => {
      if (field.include && 'in' in field.include) {
        return true;
      }
      if (field.exclude && 'from' in field.exclude) {
        return true;
      }
      // Has any of the properties a state suffix? e.g. '"disabled.someState" = true'
      if (Object.keys(field).find((key) => key.indexOf('.') > -1)) {
        return true;
      }
      return false;
    })
    .reduce(
      (flags, field) => {
        flags[field.uid] = flags[field.uid] || {};
        // show
        if (field.include && 'in' in field.include) {
          flags[field.uid].hidden = !field.include.in.includes(
            state.currentState,
          );
        }
        // hide
        if (field.exclude && 'from' in field.exclude) {
          flags[field.uid].hidden = field.exclude.from.includes(
            state.currentState,
          );
        }
        if (!flags[field.uid].hidden) {
          // disabled
          if (Field.isControlField(field) || Field.isButtonField(field)) {
            flags[field.uid].disabled =
              ((field as Field.ControlField<any, string>)[
                `disabled.${state.currentState}`
              ] as boolean) ?? (field.disabled as boolean);
          }

          // required
          if (Field.isControlField(field)) {
            flags[field.uid].required =
              ((field as Field.ControlField<any, string>)[
                `required.${state.currentState}`
              ] as boolean) ?? (field.required as boolean);
          }
        }
        return flags;
      },
      {} as State['fieldFlags'],
    );
}

function calculateForm(
  fields: Field.FormField<string>[],
  fieldFlags: State['fieldFlags'],
) {
  const acc: Field.FormField<string>[] = [];
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
