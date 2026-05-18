import type { SET_DATA } from '../actions'
import { type State } from '../model';

export const setData = (state: State, action: SET_DATA): State => {
  return {
    ...state,
    data: { ...action.payload.data },
  };
};
