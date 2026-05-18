import type * as Actions from '../actions';
import { type State } from '../model';

export const setMeta = (state: State, action: Actions.SET_META): State => {
  return {
    ...state,
    meta: { ...action.payload.meta },
  };
};
