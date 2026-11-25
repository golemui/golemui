import { type CompiledExpression, type ExpressionScope } from '../../compile/compiled-form';
import { errorCodes } from '../../errors';
import { type ExpressionFunctions } from '../../shared';
import { Debug } from '../../utils/debug';
import { type ValidationVariables } from '../../utils/form';
import { ExpressionRejectedError } from '../../utils/justin';
import { type State } from '../model';

/**
 * Evaluates the expressions of the declared states and writes the names of the active states to
 * `currentStates`, in the order of the declaration.
 *
 * A state is active only when its expression gives exactly `true`. An expression that throws
 * gives an inactive state. An expression that the expression check rejects gives an errored
 * form health, with the code of the rejection.
 *
 * @param functions - The functions of the host, which an expression calls as `$fn.<name>(...)`.
 * @returns A function from a state and the validation variables of this pass to the state with
 *   the active states. A form without states gets the same state object back.
 */
export const calculateCurrentState =
  (functions: ExpressionFunctions) =>
  (state: State, { $formIsInvalid, $errors }: ValidationVariables): State => {
    const compiledStates = state.compiled.states;
    if (compiledStates.length === 0) {
      return state;
    }

    const scope: ExpressionScope = {
      $form: state.data,
      $meta: state.meta,
      $errors,
      $formIsInvalid,
      $log: Debug.log,
      $fn: functions,
    };
    try {
      const currentStates = compiledStates
        .filter((compiledState) => isTrue(compiledState.condition, scope))
        .map((compiledState) => compiledState.name);
      return { ...state, currentStates };
    } catch (err) {
      const error = err as Error;
      const code =
        error instanceof ExpressionRejectedError
          ? error.code
          : errorCodes.calculateCurrentStateError;
      return {
        ...state,
        currentStates: [],
        formHealth: {
          status: 'errored',
          message: `[${code}] ${error.message}`,
          code,
        },
      };
    }
  };

function isTrue(condition: CompiledExpression, scope: ExpressionScope): boolean {
  try {
    return condition.evaluate(scope) === true;
  } catch (error) {
    // A rejected expression is an error in the form definition, not a state that is false.
    if (error instanceof ExpressionRejectedError) {
      throw error;
    }
    return false;
  }
}

/**
 * Expands state expressions by combining inherited conditions with logical AND operators.
 *
 * This function takes a state object where keys can represent hierarchical relationships
 * using colon separators (e.g., 'parent:child:grandchild') and expands each state's
 * expression to include all conditions from its inheritance chain.
 *
 * @example
 * ```ts
 * const states = {
 *   register: '$form.registerMode === true',
 *   'register:adult': '$form.user.age >= 18',
 *   'register:minor': '$form.user.age < 18',
 *   'register:minor:tall': '$form.user.height > 180'
 * };
 *
 * const expanded = expandStateExpressions(states);
 * // Result:
 * // {
 * //   'register': '($form.registerMode === true)',
 * //   'register:adult': '($form.registerMode === true) && ($form.user.age >= 18)',
 * //   'register:minor': '($form.registerMode === true) && ($form.user.age < 18)',
 * //   'register:minor:tall': '($form.registerMode === true) && ($form.user.age < 18) && ($form.user.height > 180)'
 * // }
 * ```
 */
export function expandStateExpressions(states: Record<string, string>): Record<string, string> {
  const expandedStates: Record<string, string> = {};

  /**
   * Helper function to get all parent state keys for a given state key
   * @param stateKey - The state key to get parent chain for
   * @returns Array of parent state keys from root to current state
   */
  function getParentChain(stateKey: string): string[] {
    const parts = stateKey.split(':');
    const chain = [];

    // Build the chain from root to current state
    for (let i = 0; i < parts.length; i++) {
      chain.push(parts.slice(0, i + 1).join(':'));
    }

    return chain;
  }

  // Process each state
  for (const [stateKey, _expression] of Object.entries(states)) {
    const parentChain = getParentChain(stateKey);
    const conditions = [];

    // Collect all conditions from the inheritance chain
    for (const parentKey of parentChain) {
      if (states[parentKey]) {
        conditions.push(`(${states[parentKey]})`);
      }
    }

    // Join all conditions with &&
    expandedStates[stateKey] = conditions.join(' && ');
  }

  return expandedStates;
}
