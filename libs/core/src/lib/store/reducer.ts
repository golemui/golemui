import { type ValidatorFn } from '../form-validator';
import { type InputWidget, isFunctionWidget, isInputWidget } from '../form-widget';
import { type I18nTranslator } from '../i18n';
import { type ValidateOn } from '../shared';
import { assertNever } from '../utils/assert-never';
import { pipe } from '../utils/function'
import { type Action } from './actions';
import { type State } from './model';
import { addWidget, calculateCurrentState, calculateWidgetFlags, calculateWidgetProps, initialize, injectValidationIssues, overrideWidgetProp, removeWidget, setData, setFormHealth, setLanguage, setMeta, setWidgetData, validateAll } from './reducers'
import { reduceIf } from './reducers/utils';

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
        return initialize(state, action);

      case 'SET_DATA':
        return pipe(
          setData(state, action),
          calculateCurrentState,
          calculateWidgetFlags,
          calculateWidgetProps(localization),
        );

      case 'SET_META':
        return pipe(
          setMeta(state, action),
          calculateCurrentState,
          calculateWidgetFlags,
          calculateWidgetProps(localization),
        );

      case 'SET_LANGUAGE':
        return pipe(
          setLanguage(state, action),
          calculateWidgetProps(localization),
        );

      case 'ADD_WIDGET':
        return pipe(
          addWidget(state, action),
          reduceIf(formIsHealthy, calculateCurrentState),
          reduceIf(formIsHealthy, calculateWidgetFlags),
          reduceIf(formIsHealthy, calculateWidgetProps(localization)),
        );

      case 'REMOVE_WIDGET':
        return pipe(
          removeWidget(state, action),
          calculateCurrentState,
          calculateWidgetFlags,
          calculateWidgetProps(localization),
        );

      case 'SET_WIDGET_INITIAL_DATA':
      case 'SET_WIDGET_DATA':
        return pipe(
          setWidgetData(state, action),
          calculateCurrentState,
          calculateWidgetFlags,
          calculateWidgetProps(localization),
        );

      case 'OVERRIDE_WIDGET_PROP':
        return pipe(
          overrideWidgetProp(state, action),
          calculateCurrentState,
          calculateWidgetFlags,
          calculateWidgetProps(localization),
          // Apply validation here because this action can be dispatched from the form's event handlers callback
          // Apply only when the action is related to an input
          reduceIf(
            (state: State): boolean => {
              let isInput = false;
              let path = '';
              if ('path' in action.payload) {
                isInput = true;
                path = action.payload.path;
              } else {
                if (isInputWidget(state.calculatedWidgets[action.payload.uid].current)) {
                  isInput = true;
                  path = (state.calculatedWidgets[action.payload.uid].current as InputWidget<any>)
                    .path;
                }
              }
              const touched = isInput && state.touchedControls[path];
              return state.touched && touched;
            },
            validateAll(validators, localization),
          ),
        );

      case 'SET_FORM_HEALTH':
        return setFormHealth(state, action);

      case 'VALIDATE_ALL': {
        return pipe(
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
          validateAll(validators, localization),
          // This handles $errors and $formIsValid expressions variables
          calculateCurrentState,
          calculateWidgetFlags,
          calculateWidgetProps(localization),
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
          return pipe(
            {
              ...state,
              touched: true,
              touchedControls: { ...state.touchedControls, [path]: true },
            },
            validateAll(validators, localization),
            // This handles $errors and $formIsValid expressions variables
            calculateCurrentState,
            calculateWidgetFlags,
            calculateWidgetProps(localization),
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
        return injectValidationIssues(state, action);
      }

      default: {
        return assertNever(action);
      }
    }
  };

const formIsHealthy = (state: State) => state.formHealth.status === 'ok';
