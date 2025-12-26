import { FormField } from '../../form-field';
import { ADD_FIELD } from '../actions';
import { State } from '../model';

export function addField(state: State, action: ADD_FIELD): State {
  return {
    ...state,
    calculatedFields: {
      ...state.calculatedFields,
      [action.payload.field.uid]: {
        source: action.payload.field,
        current: {} as FormField<string, any>,
        previous: {} as FormField<string, any>,
      },
    },
  };
}
