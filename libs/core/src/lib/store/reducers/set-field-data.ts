import { set } from '../../utils/object';
import * as Actions from '../actions';
import { State } from '../model';

export const setFieldData = (
  state: State,
  action: Actions.SET_FIELD_DATA,
): State => {
  return {
    ...state,
    data: { ...set(state.data, action.payload.path, action.payload.data) },
  };
};
