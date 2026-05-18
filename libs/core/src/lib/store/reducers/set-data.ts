import type * as Actions from '../actions';
import { type State } from '../model';

export const setData = (state: State, action: Actions.SET_DATA): State => {
  return {
    ...state,
    data: { ...action.payload.data },
  };
};
