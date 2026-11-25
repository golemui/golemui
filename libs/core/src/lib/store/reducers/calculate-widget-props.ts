import { errorCodes } from '../../errors';
import { type I18nTranslator } from '../../i18n';
import { computeWidgets } from '../../instances/compute-props';
import { calculatedRecordOfInstances } from '../../instances/instance-records';
import { type ExpressionFunctions } from '../../shared';
import { type ExpressionPolicy } from '../../utils/check-expression';
import { Debug } from '../../utils/debug';
import { calculateValidationVariables, type ValidationVariables } from '../../utils/form';
import { type State } from '../model';

/**
 * Computes every visible widget of a form, and writes the result to the instances and to
 * `calculatedWidgets`. A failure gives the same state with an errored form health.
 *
 * @param localization - The translator of the host.
 * @param functions - The functions of the host, which an expression calls as `$fn.<name>(...)`.
 * @param expressionPolicy - Which issues of the expression check make an expression fail. It is
 *   used only for a translation config that a translator returns inside its result.
 * @returns A function from a state and the validation variables of the derive to the state with
 *   the computed widgets.
 */
export const calculateWidgetProps =
  (
    localization: I18nTranslator,
    functions: ExpressionFunctions,
    expressionPolicy: ExpressionPolicy = 'warn',
  ) =>
  (state: State, validationVariables: ValidationVariables): State =>
    computeIntoState(
      state,
      () => validationVariables,
      localization,
      functions,
      expressionPolicy,
      false,
    );

/**
 * Computes again the widgets that are computed already, for example after a language change. A
 * widget that the last derive did not compute stays so, and no state and no flag is computed.
 *
 * @param localization - The translator of the host.
 * @param functions - The functions of the host, which an expression calls as `$fn.<name>(...)`.
 * @param expressionPolicy - Which issues of the expression check make an expression fail.
 * @returns A function from a state to the state with the computed widgets. The validation
 *   variables come from the validations of the state.
 */
export const recalculateWidgetProps =
  (
    localization: I18nTranslator,
    functions: ExpressionFunctions,
    expressionPolicy: ExpressionPolicy = 'warn',
  ) =>
  (state: State): State =>
    computeIntoState(
      state,
      () => calculateValidationVariables(state),
      localization,
      functions,
      expressionPolicy,
      true,
    );

/**
 * @param validationVariablesOf - Gives the validation variables. It is called inside the try,
 *   so that an error of the variables gives an errored form health, as every other error does.
 */
function computeIntoState(
  state: State,
  validationVariablesOf: () => ValidationVariables,
  localization: I18nTranslator,
  functions: ExpressionFunctions,
  expressionPolicy: ExpressionPolicy,
  onlyComputedWidgets: boolean,
): State {
  try {
    const { $formIsInvalid, $errors } = validationVariablesOf();
    const instances = computeWidgets(
      state.instances,
      state.compiled.root,
      {
        $form: state.data,
        $meta: state.meta,
        $errors,
        $formIsInvalid,
        $log: Debug.log,
        // Outside a repeater row the two names of a row have no value.
        $item: undefined,
        $index: undefined,
        $fn: functions,
      },
      {
        data: state.data,
        activeStates: new Set(state.currentStates),
        translator: localization,
        overrides: state.widgetPropOverrides,
        expressionPolicy,
        onlyComputedWidgets,
      },
    );
    return { ...state, instances, calculatedWidgets: calculatedRecordOfInstances(instances) };
  } catch (err) {
    const error = err as Error & { code?: number };
    const code = error.code ?? errorCodes.calculateWidgetPropsError;
    return {
      ...state,
      formHealth: {
        status: 'errored',
        message: `[${code}] ${error.message}`,
        code,
      },
    };
  }
}
