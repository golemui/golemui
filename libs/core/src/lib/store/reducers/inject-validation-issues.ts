import { type INJECT_VALIDATION_ISSUES } from '../actions';
import { type State } from '../model';

export function injectValidationIssues(state: State, action: INJECT_VALIDATION_ISSUES): State {
  const { path, issues } = action.payload;

  // Mark as touched any control that has injected validation issues
  const touched = issues?.length
    ? {
        touched: true,
        touchedControls: { ...state.touchedControls, [path]: true },
      }
    : {};

  return {
    ...state,
    ...touched,
    injectedValidations: {
      ...state.injectedValidations,
      [path]: issues,
    },
  };
}
