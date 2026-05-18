import type { SET_FORM_HEALTH } from '../actions'
import { type State } from '../model';

/**
 * Updates the operational state of the form.
 * This reflects whether the form is currently functioning normally
 * or is in an errored state.
 */
export const setFormHealth = (state: State, action: SET_FORM_HEALTH): State => {
  return {
    ...state,
    formHealth: action.payload.formHealth,
  };
};
