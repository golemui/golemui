import { ControlField, isControlField } from '../../form-field';
import { createValidator, Validator } from '../../form-validator';
import { get } from '../../utils/object';
import { State, ValidationState } from '../model';

export const validateAll = (state: State): State => {
  const controls = state.flatForm.filter(isControlField);
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

        // Is there a base validator or a validator that matches the current state?
        const validatorByState = getPropertyValueByCurrentState<Validator>(
          state.currentStates,
          'validator',
          control,
        );

        if (validatorByState.validator) {
          // When matchedPropertyWithState is undefined, we target obj.validator (base validator without state)
          const matchedPropertyWithState =
            validatorByState.matchedPropertyWithState || 'baseValidator';
          if (!newValidations[control.path].validators[matchedPropertyWithState]) {
            newValidations[control.path].validators[matchedPropertyWithState] = createValidator(
              validatorByState.validator,
            );
          }
          const schema = newValidations[control.path].validators[matchedPropertyWithState];
          const controlValue = get(state.data, control.path);
          const result = schema.safeParse(controlValue);
          newValidations[control.path].status = result.success
            ? null
            : { errors: result.error!.issues.map((err) => err.message) };
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

// TODO: Almost a duplicate of FormContext::getPropertyValueByCurrentState. Move it to a util and deduplicate?
function getPropertyValueByCurrentState<T>(
  currentStates: string[],
  property: string,
  obj: Record<string, any>,
): { validator: T; matchedPropertyWithState: string | undefined } {
  const matchedStates = currentStates.filter((currentState) => {
    return obj[`${property}.${currentState}`] !== undefined;
  });

  if (matchedStates.length > 0) {
    const selectedState = matchedStates
      // longer state names take precedence because they match more. e.g. `a.b.c` > `a.b`
      .sort((a, b) => b.length - a.length)
      .find((currentState) => {
        return obj[`${property}.${currentState}`] !== undefined;
      });

    if (obj[`${property}.${selectedState}`] !== undefined) {
      return {
        validator: obj[`${property}.${selectedState}`],
        matchedPropertyWithState: `${property}.${selectedState}`,
      };
    }
    return { validator: obj[property], matchedPropertyWithState: property };
  } else {
    // This is the base validator with no states
    return { validator: obj[property], matchedPropertyWithState: undefined };
  }
}
