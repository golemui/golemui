import { type DotPath } from '../../shared';
import { type INJECT_VALIDATION_ISSUES } from '../actions';
import { type State } from '../model';

export function injectValidationIssues(state: State, action: INJECT_VALIDATION_ISSUES): State {
  const { path, issues, reportedByWidget } = action.payload;

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
    widgetReportedIssuePaths: updateReportedPaths(
      state.widgetReportedIssuePaths,
      path,
      reportedByWidget === true && Boolean(issues?.length),
    ),
  };
}

function updateReportedPaths(
  reportedPaths: State['widgetReportedIssuePaths'],
  path: DotPath,
  isReported: boolean,
): State['widgetReportedIssuePaths'] {
  const wasReported = Object.prototype.hasOwnProperty.call(reportedPaths, path);
  if (wasReported === isReported) {
    return reportedPaths;
  }
  if (isReported) {
    return { ...reportedPaths, [path]: true };
  }
  const remaining = { ...reportedPaths };
  delete remaining[path];
  return remaining;
}
