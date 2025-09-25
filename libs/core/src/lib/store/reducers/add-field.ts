import { ADD_FIELD } from '../actions';
import { State } from '../model';

export function addField(state: State, action: ADD_FIELD): State {
  return {
    ...state,
    fields: {
      ...state.fields,
      [action.payload.field.uid]: action.payload.field,
    },
  };
}
