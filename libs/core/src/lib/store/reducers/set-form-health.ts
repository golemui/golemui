import * as Actions from '../actions';
import { State } from '../model';

/**
 * Updates the operational state of the form.
 * This reflects whether the form is currently functioning normally
 * or is in an errored state.
 */
export const setFormHealth = (state: State, action: Actions.SET_FORM_HEALTH): State => {
  return {
    ...state,
    formHealth: action.payload.formHealth,
  };
};
