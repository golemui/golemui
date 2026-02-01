import { FormField, isControlField, NonFunctionField } from '../../form-field';
import { ADD_FIELD } from '../actions';
import { State } from '../model';

export function addField(state: State, action: ADD_FIELD): State {
  const existingField = state.calculatedFields[action.payload.field.uid!];
  if (existingField) {
    return {
      ...state,
      formHealth: {
        status: 'errored',
        message: uidCollisionErrorMessage(existingField.source, action.payload.field),
      },
    };
  }

  return {
    ...state,
    calculatedFields: {
      ...state.calculatedFields,
      [action.payload.field.uid!]: {
        source: action.payload.field,
        current: {} as NonFunctionField,
        previous: {} as NonFunctionField,
      },
    },
  };
}

function uidCollisionErrorMessage(existingField: FormField<string>, newField: FormField<string>) {
  const getPath = (f: FormField<string>) => (isControlField(f) ? ` at "${f.path}"` : '');
  return `Duplicate UID "${newField.uid}": Assigned to widget "${existingField.widget}"${getPath(existingField)} and "${newField.widget}"${getPath(newField)}.`;
}
