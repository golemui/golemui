import { isInputWidget } from '../../form-widget';
import { cloneObject, pathExists, set } from '../../utils/object';
import { expandSources } from '../../utils/repeater';
import { type State } from '../model';

// A default value can create repeater rows whose inputs have defaults of their own, so the
// walk repeats until nothing is written. Templates are finite, the cap is only a safety net.
const MAX_PASSES = 50;

/**
 * Writes the default value of every input whose path is missing from the data, and rebuilds
 * `resolvedSources` and `repeaterItemScopes` for the data that results.
 *
 * An input whose path already exists keeps its value, so a cleared input is not defaulted again.
 * An input without a `defaultValue` gets `undefined` written at its path, which creates the
 * parent objects that expressions like `$form.user.name` read.
 *
 * @param state - The state to derive the defaults for
 * @returns The state with `data` (only when something was written), `resolvedSources` and
 *   `repeaterItemScopes` updated. `touched` and `touchedControls` are never modified.
 */
export const applyDefaultValues = (state: State): State => {
  let data = state.data;
  let expanded = expandSources(state.flatForm, data);

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let wroteDefinedValue = false;

    for (const widget of Object.values(expanded.resolvedSources)) {
      if (!isInputWidget(widget) || pathExists(data, widget.path)) {
        continue;
      }
      if (data === state.data) {
        data = cloneObject(state.data);
      }
      set(data, widget.path, cloneObject(widget.defaultValue));
      if (widget.defaultValue !== undefined) {
        wroteDefinedValue = true;
      }
    }

    // Only a defined value can add repeater rows, so nothing else needs another pass.
    if (!wroteDefinedValue) {
      break;
    }
    expanded = expandSources(state.flatForm, data);
  }

  return { ...state, data, ...expanded };
};
