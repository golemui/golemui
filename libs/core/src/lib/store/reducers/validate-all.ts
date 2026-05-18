import { type StandardSchemaV1 } from '@standard-schema/spec';
import { isStandardValidateSuccess, standardValidate, type ValidatorFn } from '../../form-validator';
import { type InputWidget, isInputWidget } from '../../form-widget';
import { type I18nTranslator } from '../../i18n';
import { type ValidationStatus } from '../../shared';
import { filterMap, SKIP, zipEvery } from '../../utils/array';
import { get } from '../../utils/object';
import { type State } from '../model';

export const validateAll =
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
            const schema: StandardSchemaV1<unknown> = validators(control.validator, localization);
            const controlValue = get(state.data, control.path);
            const result = standardValidate(
              schema,
              controlValue,
            ) as StandardSchemaV1.Result<unknown>;

            newValidations[control.path] = isStandardValidateSuccess(result)
              ? null
              : result.issues.map((issue) => issue.message);
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
