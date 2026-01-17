import { StandardSchemaV1 } from '@standard-schema/spec';
import { ControlField, isControlField } from '../../form-field';
import { isStandardValidateSuccess, standardValidate, ValidatorFn } from '../../form-validator';
import { ValidationStatus } from '../../shared';
import { filterMap, SKIP, zipEvery } from '../../utils/array';
import { get } from '../../utils/object';
import { State } from '../model';

export const validateAll =
  (validators: ValidatorFn<any>) =>
  (state: State): State => {
    const controls = filterMap(Object.values(state.calculatedFields), ({ current }) =>
      isControlField(current) ? current : SKIP,
    );

    const oldValidations = state.validations;

    return {
      ...state,
      validations: controls.reduce(
        (
          newValidations: Record<string, ValidationStatus>,
          control: ControlField<unknown, string>,
        ): Record<string, ValidationStatus> => {
          // By default the field is valid
          newValidations[control.path] = null;

          if (control.validator) {
            const schema: StandardSchemaV1<unknown> = validators(control.validator);
            const controlValue = get(state.data, control.path);
            const result = standardValidate(
              schema,
              controlValue,
            ) as StandardSchemaV1.Result<unknown>;

            console.log(result);

            newValidations[control.path] = isStandardValidateSuccess(result)
              ? null
              : result.issues.map((issue) => issue.message);
          }

          if (
            Array.isArray(newValidations[control.path]) &&
            Array.isArray(oldValidations[control.path])
          ) {
            // Check if they are structurally different, if they are, keep the old string[] ref to avoid change detection
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
