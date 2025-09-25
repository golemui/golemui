import { deleteKey } from '../../utils/object';
import { REMOVE_FIELD } from '../actions';
import { State } from '../model';

export function removeField(state: State, action: REMOVE_FIELD): State {
  return {
    ...state,
    fields: {
      ...deleteKey(state.fields, action.payload.uid),
    },
  };
}
