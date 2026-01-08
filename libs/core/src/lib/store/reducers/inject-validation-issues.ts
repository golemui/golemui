import { INJECT_VALIDATION_ISSUES } from '../actions';
import { State } from '../model';

export function injectValidationIssues(state: State, action: INJECT_VALIDATION_ISSUES): State {
  return {
    ...state,
    injectedValidations: {
      ...state.injectedValidations,
      [action.payload.path]: action.payload.issues,
    },
  };
}
