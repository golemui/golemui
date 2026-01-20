import * as Actions from '../actions';
import { State } from '../model';

export const setLanguage = (state: State, action: Actions.SET_LANGUAGE): State => {
  return {
    ...state,
    lang: action.payload.lang,
  };
};
