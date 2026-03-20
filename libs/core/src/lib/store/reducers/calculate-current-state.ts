import { compile, parse } from 'subscript/justin';
import { FormHealth, State } from '../model';
import { errorCodes } from '../../errors';

export const calculateCurrentState = (state: State): State => {
  let stateExpressions = state.formDef.states;
  if (!stateExpressions || Object.keys(stateExpressions).length === 0) {
    return state;
  }

  if (state.formHealth.status === 'errored') {
    return state;
  }

  stateExpressions = expandStateExpressions(stateExpressions);

  let currentStates: string[] = [];
  let formHealth: FormHealth = { status: 'ok' };
  try {
    // TODO: Cache compiled expressions
    currentStates = Object.keys(stateExpressions)
      .map((stateName) => {
        const expression = stateExpressions[stateName];
        const ast = parse(expression);
        const evaluate = compile(ast);
        let result: boolean;
        try {
          result = evaluate({
            $form: state.data,
            $log: (value: any, label?: string) => {
              if (label) {
                console.log(label, value);
              } else {
                console.log(value);
              }
              return value;
            },
          });
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
