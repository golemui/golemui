import { computeWidgetFlags } from '../../instances/compute-flags';
import { flagsRecordOfInstances } from '../../instances/instance-records';
import { type ExpressionFunctions } from '../../shared';
import { Debug } from '../../utils/debug';
import { type ValidationVariables } from '../../utils/form';
import { type State } from '../model';

/**
 * Computes the flags of every widget instance from its include / exclude / disabled / readonly
 * conditions, and writes them to the instances and to `widgetFlags`. The conditions of a widget
 * below a hidden widget are not evaluated.
 *
 * @param functions - The functions of the host, which a condition calls as `$fn.<name>(...)`.
 * @returns A function from a state and the validation variables of this pass to the state with
 *   the new flags. It returns the same state object when no flag changed.
 */
export const calculateWidgetFlags =
  (functions: ExpressionFunctions) =>
  (state: State, { $formIsInvalid, $errors }: ValidationVariables): State => {
    const instances = computeWidgetFlags(
      state.instances,
      state.compiled.root,
      state.data,
      {
        $form: state.data,
        $meta: state.meta,
        $errors,
        $formIsInvalid,
        $log: Debug.log,
        $fn: functions,
      },
      new Set(state.currentStates),
    );
    if (instances === state.instances) {
      return state;
    }
    return { ...state, instances, widgetFlags: flagsRecordOfInstances(instances) };
  };
