import { get, set } from '../../utils/object';
import * as Actions from '../actions';
import { State } from '../model';

export const setFieldData = (
  state: State,
  action: Actions.SET_FIELD_DATA | Actions.SET_FIELD_INITIAL_DATA,
): State => {
  const oldValue = get(state.data, action.payload.path);
  const shouldUpdate =
    action.type === 'SET_FIELD_DATA' ||
    (action.type === 'SET_FIELD_INITIAL_DATA' && oldValue === undefined);
  if (shouldUpdate) {
    return {
      ...state,
      data: { ...set(state.data, action.payload.path, action.payload.data) },
    };
  } else {
    return state;
  }
};
