import { ValidatorFn } from '../form-validator';
import { isFunctionWidget, isInputWidget } from '../form-widget';
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
          Reducers.calculateWidgetFlags,
          Reducers.calculateWidgetProps(localization),
        );

      case 'SET_META':
        return Fn.pipe(
          Reducers.setMeta(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateWidgetFlags,
          Reducers.calculateWidgetProps(localization),
        );

      case 'SET_LANGUAGE':
        return Fn.pipe(
          Reducers.setLanguage(state, action),
          Reducers.calculateWidgetProps(localization),
        );

      case 'ADD_WIDGET':
        return Fn.pipe(
          Reducers.addWidget(state, action),
          reduceIf(formIsHealthy, Reducers.calculateCurrentState),
          reduceIf(formIsHealthy, Reducers.calculateWidgetFlags),
          reduceIf(formIsHealthy, Reducers.calculateWidgetProps(localization)),
        );

      case 'REMOVE_WIDGET':
        return Fn.pipe(
          Reducers.removeWidget(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateWidgetFlags,
          Reducers.calculateWidgetProps(localization),
        );

      case 'SET_WIDGET_INITIAL_DATA':
      case 'SET_WIDGET_DATA':
        return Fn.pipe(
          Reducers.setWidgetData(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateWidgetFlags,
          Reducers.calculateWidgetProps(localization),
        );

      case 'OVERRIDE_WIDGET_PROP':
        return Fn.pipe(
          Reducers.overrideWidgetProp(state, action),
          Reducers.calculateCurrentState,
          Reducers.calculateWidgetFlags,
          Reducers.calculateWidgetProps(localization),
          // Apply validation here because this action can be dispatched from the form's event handlers callback
          reduceIf(
            isControlTouched(action.payload.path),
            Reducers.validateAll(validators, localization),
          ),
        );

      case 'SET_FORM_HEALTH':
        return Reducers.setFormHealth(state, action);

      case 'VALIDATE_ALL': {
        return Fn.pipe(
          {
            ...state,
            touched: true,
            touchedControls: Object.keys(state.calculatedWidgets).reduce(
              (touchedControls, key) => {
                const widget = state.calculatedWidgets[key].source;
                if (isInputWidget(widget)) {
                  touchedControls[widget.path] = true;
                }
                return touchedControls;
              },
              {} as State['touchedControls'],
            ),
          },
          Reducers.validateAll(validators, localization),
          // This handles $errors and $formIsValid expressions variables
          Reducers.calculateCurrentState,
          Reducers.calculateWidgetFlags,
          Reducers.calculateWidgetProps(localization),
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
            Reducers.validateAll(validators, localization),
            // This handles $errors and $formIsValid expressions variables
            Reducers.calculateCurrentState,
            Reducers.calculateWidgetFlags,
            Reducers.calculateWidgetProps(localization),
            // TODO: extract this into a separate function
            // When the widget is a Widget Function, we propagate the validation result immediately
            (state) => {
              const uid = action.payload.uid;
              const originalDerivedWidget = state.calculatedWidgets[uid];
              const originalSource = originalDerivedWidget.source;
              if (isFunctionWidget(originalSource)) {
                // TODO: prev vs current validation comparison to avoid change detection here
                const current = originalSource({
                  $form: state.data,
                  errors: state.validations[path],
                  touched: true,
                  translate: localization.translate,
                });
                return {
                  ...state,
                  calculatedWidgets: {
                    ...state.calculatedWidgets,
                    [uid]: {
                      source: originalDerivedWidget.source,
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
