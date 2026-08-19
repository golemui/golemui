import { type NonFunctionWidget } from '../../form-widget';
import { type State } from '../model';

/**
 * Gives every widget the current data produces an entry in `calculatedWidgets`, and removes the
 * entries of widgets it no longer produces.
 *
 * A new entry starts with an empty `current`, which the props step fills in. Existing entries are
 * kept as they are so the props step can compare against the widget it computed last time.
 *
 * @param state - The state to fill, after `resolvedSources` has been rebuilt
 * @returns The same state object when the set of uids did not change, otherwise a new one
 */
export const fillCalculatedWidgets = (state: State): State => {
  const uids = Object.keys(state.resolvedSources);
  const calculatedWidgets: State['calculatedWidgets'] = {};
  let changed = uids.length !== Object.keys(state.calculatedWidgets).length;

  for (const uid of uids) {
    const existing = state.calculatedWidgets[uid];
    if (existing) {
      calculatedWidgets[uid] = existing;
    } else {
      calculatedWidgets[uid] = {
        source: state.resolvedSources[uid],
        current: {} as NonFunctionWidget<string>,
      };
      changed = true;
    }
  }

  return changed ? { ...state, calculatedWidgets } : state;
};
