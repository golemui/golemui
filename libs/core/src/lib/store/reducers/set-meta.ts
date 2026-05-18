import type { SET_META } from '../actions';
import { type State } from '../model';

export const setMeta = (state: State, action: SET_META): State => {
  return {
    ...state,
    meta: { ...action.payload.meta },
  };
};
