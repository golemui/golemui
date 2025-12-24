import { FormField } from '../../form-field';
import { ADD_FIELD } from '../actions';
import { State } from '../model';

export function addField(state: State, action: ADD_FIELD): State {
  return {
    ...state,
    calculatedFields: {
      ...state.calculatedFields,
      [action.payload.field.uid]: {
        uid: action.payload.field.uid,
        kind: action.payload.field.kind,
        widget: action.payload.field.widget,
      } as FormField<string, any>,
    },
  };
}
