import { errorCodes } from '../../errors';
import { calculateValidationVariables } from '../../utils/form';
import { expressionIsTrue } from '../../utils/justin';
import { type FormHealth, type State } from '../model';

export const calculateCurrentState = (state: State): State => {
  let stateExpressions = state.formDef.states;
  if (!stateExpressions || Object.keys(stateExpressions).length === 0) {
    return state;
  }

  if (state.formHealth.status === 'errored') {
    return state;
  }

  // Precalculate the validation variables for all the following steps
  const { $formIsInvalid, $errors } = calculateValidationVariables(state);

  stateExpressions = expandStateExpressions(stateExpressions);

  let currentStates: string[] = [];
  let formHealth: FormHealth = { status: 'ok' };
  try {
    currentStates = Object.keys(stateExpressions)
      .map((stateName) => {
        const expression = stateExpressions[stateName];
        let result: boolean;
        try {
          result = expressionIsTrue(expression, state.data, state.meta, $errors, $formIsInvalid);
        } catch {
          result = false;
        }
        return result === true ? stateName : undefined;
      })
      .filter((stateName) => stateName !== undefined);
  } catch (err) {
    const error = err as Error;
    const code = errorCodes.calculateCurrentStateError;
    formHealth = {
      status: 'errored',
      message: `[${code}] ${error.message}`,
      code,
    };
  }

  return { ...state, currentStates, formHealth };
};

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
function expandStateExpressions(states: Record<string, string>): Record<string, string> {
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
