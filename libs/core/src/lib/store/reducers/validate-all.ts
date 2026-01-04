import { StandardSchemaV1 } from '@standard-schema/spec';
import { ControlField, isControlField } from '../../form-field';
import { isStandardValidateSuccess, standardValidate, ValidatorFn } from '../../form-validator';
import { filterMap, SKIP } from '../../utils/array';
import { get } from '../../utils/object';
import { State, ValidationState } from '../model';

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
          newValidations: Record<string, ValidationState>,
          control: ControlField<unknown, string>,
        ): Record<string, ValidationState> => {
          // Keep the previously cached schemas
          newValidations[control.path] =
            oldValidations[control.path] ||
            ({
              validators: {},
              status: null,
            } satisfies ValidationState);

          if (control.validator) {
            const schema: StandardSchemaV1<unknown> = validators(control.validator);
            const controlValue = get(state.data, control.path);
            const result = standardValidate(
              schema,
              controlValue,
            ) as StandardSchemaV1.Result<unknown>;

            newValidations[control.path].status = isStandardValidateSuccess(result)
              ? null
              : { issues: result.issues.map((issue) => issue.message) };
          } else {
            // If there's no validator, the field is valid
            newValidations[control.path].status = null;
          }

          if (newValidations[control.path] !== oldValidations[control.path]) {
            // Make it a new reference so the stream emits
            newValidations[control.path] = { ...newValidations[control.path] };
          }

          return newValidations;
        },
        {} as State['validations'],
      ),
    };
  };
