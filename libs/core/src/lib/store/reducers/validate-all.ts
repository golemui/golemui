import { type StandardSchemaV1 } from '@standard-schema/spec';
import { errorCodes, errorMessage } from '../../errors';
import {
  isStandardValidateSuccess,
  standardValidate,
  type ValidatorFn,
} from '../../form-validator';
import { type InputWidget, isInputWidget } from '../../form-widget';
import { type I18nTranslator } from '../../i18n';
import { type ValidationStatus } from '../../shared';
import { filterMap, SKIP, zipEvery } from '../../utils/array';
import { get } from '../../utils/object';
import { type State } from '../model';

/**
 * Validates the visible inputs. A validator that throws gives the form health code 60 instead of an
 * exception. That health and its first message stay until the app clears them with
 * `SET_FORM_HEALTH` or `INITIALIZE`.
 *
 * @param validators - The factory that makes a schema from a widget validator.
 * @param localization - The translator of the validation messages.
 * @returns A function from the state to the state after validation.
 */
export const validateAll = (validators: ValidatorFn<any>, localization: I18nTranslator) => {
  const validateInputs = runValidators(validators, localization);

  return (state: State): State => {
    if (hasValidationError(state)) {
      return state;
    }
    try {
      return validateInputs(state);
    } catch (error) {
      const code = errorCodes.validationError;
      return {
        ...state,
        isFormValid: false,
        formHealth: { status: 'errored', code, message: `[${code}] ${errorMessage(error)}` },
      };
    }
  };
};

/**
 * Tells if a validator failed in this form and the app has not cleared the health yet.
 *
 * @param state - The form state.
 * @returns True when the form health has code 60.
 */
export const hasValidationError = ({ formHealth }: State): boolean =>
  formHealth.status === 'errored' && formHealth.code === errorCodes.validationError;

const runValidators =
  (validators: ValidatorFn<any>, localization: I18nTranslator) =>
  (state: State): State => {
    const controls = filterMap(Object.values(state.calculatedWidgets), ({ current }) =>
      isInputWidget(current) ? current : SKIP,
    );

    const oldValidations = state.validations;

    return {
      ...state,
      validations: controls.reduce(
        (
          newValidations: Record<string, ValidationStatus>,
          control: InputWidget<unknown, string>,
        ): Record<string, ValidationStatus> => {
          // By default the widget is valid
          newValidations[control.path] = null;

          if (control.validator) {
            try {
              const schema: StandardSchemaV1<unknown> = validators(control.validator, localization);
              const controlValue = get(state.data, control.path);
              const result = standardValidate(
                schema,
                controlValue,
              ) as StandardSchemaV1.Result<unknown>;

              newValidations[control.path] = isStandardValidateSuccess(result)
                ? null
                : result.issues.map((issue) => issue.message);
            } catch (error) {
              // The health message has no stack, and this can be a bug in the code of the app.
              console.error(`[GolemUI] The validator of input "${control.path}" failed:`, error);
              throw new Error(
                `The validator of input "${control.path}" failed: ${errorMessage(error)}`,
              );
            }
          }

          if (
            Array.isArray(newValidations[control.path]) &&
            Array.isArray(oldValidations[control.path])
          ) {
            // Check if they are structurally equal, if they are, keep the old string[] ref to avoid change detection
            if (
              zipEvery(
                newValidations[control.path] as string[],
                oldValidations[control.path] as string[],
                (a, b) => a === b,
              )
            ) {
              newValidations[control.path] = oldValidations[control.path];
            }
          }

          return newValidations;
        },
        {} as State['validations'],
      ),
    };
  };
