import { expandSources } from '../../utils/repeater';
import { type State } from '../model';

/**
 * Rebuilds `resolvedSources` and `repeaterItemScopes` from the flat form and the current data.
 * `calculateWidgetFlags` and `calculateWidgetProps` read these maps, so this step runs before them.
 */
export const applyExpandSources = (state: State): State => ({
  ...state,
  ...expandSources(state.flatForm, state.data),
});
