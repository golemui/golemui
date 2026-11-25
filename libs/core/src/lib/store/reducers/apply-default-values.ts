import { isInputWidget } from '../../form-widget';
import { buildWidgetInstances } from '../../instances/build-instances';
import { recordsOfInstances } from '../../instances/instance-records';
import { forEachInstance } from '../../instances/widget-instance';
import { cloneObject, copyOnWriteSet, pathExists } from '../../utils/object';
import { type State } from '../model';

// A default value can create repeater rows whose inputs have defaults of their own, so the
// walk repeats until nothing is written. Templates are finite, the cap is only a safety net.
const MAX_PASSES = 50;

/**
 * Builds the widget instances for the data, and writes the default value of every input whose
 * path is missing from the data.
 *
 * An input whose path already exists keeps its value, so a cleared input is not defaulted again.
 * An input without a `defaultValue` gets `undefined` written at its path, which creates the
 * parent objects that expressions like `$form.user.name` read.
 *
 * @param state - The state to derive the defaults for
 * @returns The state with `data` (only when something was written) and `instances`. When the
 *   instances changed, the records that `recordsOfInstances` writes are written again from them,
 *   with the flags that the instances have from the last derive. `touched` and `touchedControls`
 *   are never modified.
 */
export const applyDefaultValues = (state: State): State => {
  const compiledRoot = state.compiled.root;
  let data = state.data;
  let instances = buildWidgetInstances(compiledRoot, data, state.instances);

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let wroteDefinedValue = false;

    forEachInstance(instances.root, ({ source }) => {
      if (!isInputWidget(source) || pathExists(data, source.path)) {
        return;
      }
      // The default is cloned so an edit can never write back into the widget definition.
      data = copyOnWriteSet(data, source.path, cloneObject(source.defaultValue));
      if (source.defaultValue !== undefined) {
        wroteDefinedValue = true;
      }
    });

    // Only a defined value starts another pass. A write of `undefined` can add an array entry
    // too, and the row of that entry is built by the next derive.
    if (!wroteDefinedValue) {
      break;
    }
    // A build can remove a row that a default value of this pass adds again. The tree of the
    // last derive still has the instance of that row.
    instances = buildWidgetInstances(compiledRoot, data, instances, state.instances);
  }

  if (instances === state.instances) {
    return { ...state, data };
  }
  return { ...state, data, instances, ...recordsOfInstances(instances, compiledRoot) };
};
