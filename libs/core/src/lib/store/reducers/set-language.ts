import type { SET_LANGUAGE } from '../actions'
import { type State } from '../model';

export const setLanguage = (state: State, action: SET_LANGUAGE): State => {
  return {
    ...state,
    lang: action.payload.lang,
  };
};
