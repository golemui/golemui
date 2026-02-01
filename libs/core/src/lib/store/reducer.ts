import { isControlField, isFunctionField } from '../form-field';
import { ValidatorFn } from '../form-validator';
import { I18nTranslator } from '../i18n';
import { ValidateOn } from '../shared';
import { assertNever } from '../utils/assert-never';
import * as Fn from '../utils/function';
import { Action } from './actions';
import { State } from './model';
import * as Reducers from './reducers';
import { isControlTouched, reduceIf } from './reducers/utils';

export const reducer =
  ({
    validators,
    validateOn,
    localization,
  }: {
    validators: ValidatorFn<any>;
    validateOn: ValidateOn;
    localization: I18nTranslator;
  }) =>
  (state: State, action: Action): State => {
    switch (action.type) {
      case 'INITIALIZE':
        return Reducers.initialize(state, action);

      case 'SET_DATA':
        return Fn.pipe(
          Reducers.setData(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateFieldFlags,
          Reducers.calculateFieldProps(localization),
        );

      case 'SET_LANGUAGE':
        return Fn.pipe(
          Reducers.setLanguage(state, action),
          Reducers.calculateFieldProps(localization),
        );

      case 'ADD_FIELD':
        return Fn.pipe(
          Reducers.addField(state, action),
          reduceIf(formIsHealthy, Reducers.calculateCurrentState),
          reduceIf(formIsHealthy, Reducers.calculateFieldFlags),
          reduceIf(formIsHealthy, Reducers.calculateFieldProps(localization)),
        );

      case 'REMOVE_FIELD':
        return Fn.pipe(
          Reducers.removeField(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateFieldFlags,
          Reducers.calculateFieldProps(localization),
        );

      case 'SET_FIELD_INITIAL_DATA':
      case 'SET_FIELD_DATA':
        return Fn.pipe(
          Reducers.setFieldData(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateFieldFlags,
          Reducers.calculateFieldProps(localization),
        );

      case 'OVERRIDE_FIELD_PROP':
        return Fn.pipe(
          Reducers.overrideFieldProp(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateFieldFlags,
          Reducers.calculateFieldProps(localization),
          // Apply validation here because this action can be dispatched from the form's event handlers callback
          reduceIf(isControlTouched(action.payload.path), Reducers.validateAll(validators)),
        );

      case 'SET_FORM_HEALTH':
        return Reducers.setFormHealth(state, action);

      case 'VALIDATE_ALL': {
        return Fn.pipe(
          {
            ...state,
            touched: true,
            touchedControls: Object.keys(state.calculatedFields).reduce(
              (touchedControls, key) => {
                const field = state.calculatedFields[key].source;
                if (isControlField(field)) {
                  touchedControls[field.path] = true;
                }
                return touchedControls;
              },
              {} as State['touchedControls'],
            ),
          },
          Reducers.validateAll(validators),
        );
      }

      case 'ATTEMPT_VALIDATION': {
        const reason = action.payload.reason;
        const path = action.payload.path;
        const shouldValidate =
          validateOn === 'eager' ||
          reason === validateOn ||
          (validateOn as string[]).includes(reason);
        if (shouldValidate) {
          return Fn.pipe(
            {
              ...state,
              touched: true,
              touchedControls: { ...state.touchedControls, [path]: true },
            },
            Reducers.validateAll(validators),
            // TODO: extract this into a separate function
            // When the field is a Field Function, we propagate the validation result immediately
            (state) => {
              const uid = action.payload.uid;
              const originalDerivedField = state.calculatedFields[uid];
              const originalSource = originalDerivedField.source;
              if (isFunctionField(originalSource)) {
                // TODO: prev vs current validation comparison to avoid change detection here
                const current = originalSource({
                  $form: state.data,
                  errors: state.validations[path],
                  touched: true,
                  translate: localization.translate,
                });
                return {
                  ...state,
                  calculatedFields: {
                    ...state.calculatedFields,
                    [uid]: {
                      ...originalDerivedField,
                      previous: originalDerivedField.current,
                      current,
                    },
                  },
                };
              }
              return state;
            },
          );
        }

        return state;
      }

      case 'INJECT_VALIDATION_ISSUES': {
        return Reducers.injectValidationIssues(state, action);
      }

      default: {
        return assertNever(action);
      }
    }
  };

const formIsHealthy = (state: State) => state.formHealth.status === 'ok';
