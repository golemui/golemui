import { Flags } from '../form-field';
import { ValidatorFn } from '../form-validator';
import { ValidateOn } from '../shared';
import { assertNever } from '../utils/assert-never';
import { pipe } from '../utils/function';
import { Action } from './actions';
import { State } from './model';
import * as Reducers from './reducers';
import { isControlTouched, reduceIf } from './reducers/utils';

export const reducer =
  ({ validators, validateOn }: { validators: ValidatorFn<any>; validateOn: ValidateOn }) =>
  (state: State, action: Action): State => {
    switch (action.type) {
      case 'INITIALIZE':
        return Reducers.initialize(state, action);

      case 'SET_DATA':
        return pipe(
          Reducers.setData(state, action),
          Reducers.calculateCurrentState,
          Reducers.applyCurrentState,
          // reduceIf(isControlTouched, Reducers.validateAll(validators)),
        );

      case 'ADD_FIELD':
        return pipe(
          Reducers.addField(state, action),
          Reducers.calculateCurrentState,
          Reducers.applyCurrentState,
          // reduceIf(isControlTouched, Reducers.validateAll(validators)),
        );

      case 'REMOVE_FIELD':
        return Reducers.removeField(state, action);

      case 'SET_FIELD_DATA':
        return pipe(
          Reducers.setFieldData(state, action),
          Reducers.calculateCurrentState,
          Reducers.applyCurrentState,
          // reduceIf(isControlTouched, Reducers.validateAll(validators)),
        );

      case 'OVERRIDE_FIELD_PROP':
        return pipe(
          Reducers.overrideFieldProp(state, action),
          Reducers.calculateCurrentState,
          Reducers.applyCurrentState,
          // Apply validation here because this action can be dispatched from the form's event handlers callback
          reduceIf(isControlTouched(action.payload.path), Reducers.validateAll(validators)),
        );

      case 'SET_ERROR':
        return Reducers.setError(state, action);

      case 'VALIDATE_ALL': {
        const newState: State = {
          ...state,
          fieldFlags: Object.keys(state.fields).reduce(
            (fieldFlags, key) => {
              const fieldFlag = state.fieldFlags[key] || {};
              fieldFlags[key] = { ...fieldFlag, touched: true } as Flags;
              return fieldFlags;
            },
            {} as State['fieldFlags'],
          ),
        };
        return pipe(newState, Reducers.validateAll(validators));
      }

      case 'ATTEMPT_VALIDATION': {
        const reason = action.payload.reason;
        const path = action.payload.path;
        const shouldValidate =
          validateOn === 'eager' ||
          reason === validateOn ||
          (validateOn as string[]).includes(reason);
        if (shouldValidate) {
          return pipe(
            {
              ...state,
              touched: true,
              touchedControls: { ...state.touchedControls, [path]: true },
            },
            Reducers.validateAll(validators),
          );
        }

        return state;
      }

      default: {
        return assertNever(action);
      }
    }
  };
