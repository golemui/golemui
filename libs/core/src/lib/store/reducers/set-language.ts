import type * as Actions from '../actions';
import { type State } from '../model';

export const setLanguage = (state: State, action: Actions.SET_LANGUAGE): State => {
  return {
    ...state,
    lang: action.payload.lang,
  };
};
