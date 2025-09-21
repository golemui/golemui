import * as Actions from '../actions';
import { State } from '../model';

export const setError = (state: State, action: Actions.SET_ERROR): State => {
  return {
    ...state,
    error: action.payload.error,
  };
};
