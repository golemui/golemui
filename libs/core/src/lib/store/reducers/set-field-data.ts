import { get, set } from '../../utils/object';
import * as Actions from '../actions';
import { State } from '../model';

export const setFieldData = (
  state: State,
  action: Actions.SET_FIELD_DATA,
): State => {
  const oldValue = get(state.data, action.payload.path);
  const shouldUpdate = action.updateIf(oldValue);
  if (shouldUpdate) {
    return {
      ...state,
      data: { ...set(state.data, action.payload.path, action.payload.data) },
    };
  } else {
    return state;
  }
};
