import * as Field from '../../form-field';
import { FormField } from '../../form-field';
import { State } from '../model';
import { FormFunction, FormFunctionTree } from '../../shared';

export const executeCurrentFunctions = (state: State, fields: Record<string, FormFunctionTree>) => {
  Object.keys(fields).forEach((uid) => {
    const field = fields[uid] as FormFunctionTree;

    Object.keys(field).forEach((key) => {
      if (typeof field[key] === 'function') {
        const func = field[key] as FormFunction;
        const result = func(state);
        const control = state.flatForm.find((f) => f.uid === uid);
        if (control) {
          control[key as keyof FormField<string>] = result;
        }
      }
    });

    if (field.props) {
      Object.keys(field.props).forEach((prop) => {
        const func = field.props[prop] as FormFunction;
        const result = func(state);
        const control = state.flatForm.find((f) => f.uid === uid);
        if (control?.props) {
          control.props = { ...control.props, [prop]: result };
        }
      });
    }
  });
};

// TODO: Should we allow include.in and exclude.from at the same time?
export const applyCurrentState = (state: State): State => {
  executeCurrentFunctions(state, state.currentFunctions);

  const fieldFlags = calculateFieldFlags(state);

  return {
    ...state,
    fieldFlags,
  };
};

function calculateFieldFlags(state: State): State['fieldFlags'] {
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

        // Only process fields that are visible
        if (!flags[field.uid].hidden) {
          // disabled
          if (Field.isControlField(field) || Field.isInteractiveField(field)) {
            setFlag({
              property: 'disabled',
              field,
              flags,
              currentStates: state.currentStates,
            });
          }

          // required
          if (Field.isControlField(field)) {
            setFlag({
              property: 'required',
              field,
              flags,
              currentStates: state.currentStates,
            });
          }

          // readonly
          if (Field.isControlField(field)) {
            setFlag({
              property: 'readonly',
              field,
              flags,
              currentStates: state.currentStates,
            });
          }
        }
        return flags;
      },
      {} as State['fieldFlags'],
    );
}

// FIXME: No type safety at all!!
function setFlag({
  currentStates,
  field,
  property,
  flags,
}: {
  currentStates: string[];
  field: Record<string, any>;
  property: string;
  flags: Record<string, Record<string, any>>;
}) {
  const matchedState = currentStates
    .sort((a, b) => b.length - a.length)
    .find((currentState) => {
      const currentStateValue = field[`${property}.${currentState}`];
      return currentStateValue !== undefined;
    });
  // if the property is explicitly set on any of the current states, it wins.
  if (matchedState !== undefined) {
    flags[field['uid']][property] = field[`${property}.${matchedState}`];
  } else {
    flags[field['uid']][property] = field[property];
  }
}
