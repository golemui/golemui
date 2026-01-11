import { isFunctionField } from '../../form-field';
import { State } from '../model';

export const calculateFieldFlags = (state: State): State => {
  return {
    ...state,
    fieldFlags: calculateFlags(state),
  };
};

// TODO: Do we need this at all? can't we just do this during calculate-field-props during the layout.children calculations?
function calculateFlags(state: State): State['fieldFlags'] {
  // TODO: we are not accounting for repeater fields here
  return (
    Object.values(state.flatForm)
      // TODO: use filterMap
      .map((field) => {
        if (isFunctionField(field)) {
          const field_ = field({
            $form: state.data,
            errors: field.path ? state.validations[field.path] : undefined,
          });
          field_.uid = field.uid!;
          return field_;
        }
        return field;
      })
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
            flags[field.uid].hidden = !field.include.in.some((fieldState) =>
              state.currentStates.includes(fieldState),
            );
          }
          // hide
          if (field.exclude && 'from' in field.exclude) {
            flags[field.uid].hidden = field.exclude.from.some((fieldState) =>
              state.currentStates.includes(fieldState),
            );
          }

          return flags;
        },
        {} as State['fieldFlags'],
      )
  );
}
