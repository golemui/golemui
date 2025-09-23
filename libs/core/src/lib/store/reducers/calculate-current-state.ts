import { compile, parse } from 'subscript/justin';
import { FormStoreError, State } from '../model';

export const calculateCurrentState = (state: State): State => {
  const stateExpressions = state.formDef.states;
  if (!stateExpressions || Object.keys(stateExpressions).length === 0) {
    return state;
  }

  let currentState = '';
  let error: FormStoreError = { kind: 'none' };
  try {
    // TODO: Security. See: https://github.com/dy/subscript/issues/25
    // TODO: Cache compiled expressions
    currentState =
      Object.keys(stateExpressions).find((stateName) => {
        const expression = stateExpressions[stateName];
        const ast = parse(expression);
        const evaluate = compile(ast);
        const result = evaluate({
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
        return result === true;
      }) || '';
  } catch (err: unknown) {
    error = { kind: 'fatal', error: (err as Error).message };
  }

  return { ...state, currentState, error };
};
