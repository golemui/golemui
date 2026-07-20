import { type ValidatorFn } from '../form-validator';
import { type InputWidget, isFunctionWidget, isInputWidget } from '../form-widget';
import { type I18nTranslator } from '../i18n';
import { type ExpressionFunctions, type ValidateOn } from '../shared';
import { assertNever } from '../utils/assert-never';
import { pipe } from '../utils/function';
import { get } from '../utils/object';
import { type Action } from './actions';
import { type State } from './model';
import {
  addWidget,
  calculateCurrentState,
  calculateWidgetFlags,
  calculateWidgetProps,
  initialize,
  injectValidationIssues,
  materializeRepeaterItems,
  overrideWidgetProp,
  removeWidget,
  setData,
  setFormHealth,
  setLanguage,
  setMeta,
  setWidgetData,
  validateAll,
} from './reducers';
import { reduceIf } from './reducers/utils';

export const reducer = ({
  validators,
  validateOn,
  localization,
  functions,
}: {
  validators: ValidatorFn<any>;
  validateOn: ValidateOn;
  localization: I18nTranslator;
  functions: ExpressionFunctions;
}) => {
  const applyCurrentState = calculateCurrentState(functions);
  const applyWidgetFlags = calculateWidgetFlags(functions);
  const applyWidgetProps = calculateWidgetProps(localization, functions);

  return (state: State, action: Action): State => {
    switch (action.type) {
      case 'INITIALIZE':
        return initialize(state, action);

      case 'SET_DATA':
        return pipe(
          setData(state, action),
          applyCurrentState,
          materializeRepeaterItems,
          applyWidgetFlags,
          applyWidgetProps,
        );

      case 'SET_META':
        return pipe(
          setMeta(state, action),
          applyCurrentState,
          materializeRepeaterItems,
          applyWidgetFlags,
          applyWidgetProps,
        );

      case 'SET_LANGUAGE':
        return pipe(setLanguage(state, action), applyWidgetProps);

      case 'ADD_WIDGET':
        return pipe(
          addWidget(state, action),
          reduceIf(formIsHealthy, applyCurrentState),
          reduceIf(formIsHealthy, materializeRepeaterItems),
          reduceIf(formIsHealthy, applyWidgetFlags),
          reduceIf(formIsHealthy, applyWidgetProps),
        );

      case 'REMOVE_WIDGET':
        return pipe(
          removeWidget(state, action),
          applyCurrentState,
          materializeRepeaterItems,
          applyWidgetFlags,
          applyWidgetProps,
        );

      case 'SET_WIDGET_INITIAL_DATA':
      case 'SET_WIDGET_DATA':
        return pipe(
          setWidgetData(state, action),
          applyCurrentState,
          materializeRepeaterItems,
          applyWidgetFlags,
          applyWidgetProps,
        );

      case 'OVERRIDE_WIDGET_PROP':
        return pipe(
          overrideWidgetProp(state, action),
          applyCurrentState,
          materializeRepeaterItems,
          applyWidgetFlags,
          applyWidgetProps,
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
          applyCurrentState,
          materializeRepeaterItems,
          applyWidgetFlags,
          applyWidgetProps,
          calculateIsFormValid,
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
            applyCurrentState,
            materializeRepeaterItems,
            applyWidgetFlags,
            applyWidgetProps,
            // TODO: extract this into a separate function
            // When the widget is a Widget Function, we propagate the validation result immediately
            (state) => {
              const uid = action.payload.uid;
              const originalDerivedWidget = state.calculatedWidgets[uid];
              const originalSource = originalDerivedWidget.source;
              if (isFunctionWidget(originalSource)) {
                const itemScope = state.repeaterItemScopes[uid];
                // TODO: prev vs current validation comparison to avoid change detection here
                const current = originalSource({
                  $form: state.data,
                  errors: state.validations[path],
                  touched: true,
                  translate: localization.translate,
                  $item: itemScope ? get(state.data, itemScope.itemPath) : undefined,
                  $index: itemScope?.index,
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
            calculateIsFormValid,
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
};

const formIsHealthy = (state: State) => state.formHealth.status === 'ok';

// TODO: dedupe this. we already have $formIsInvalid (although it doesnt take into account injected validations)
function calculateIsFormValid(state: State): State {
  const injectedValidationsKeys = Object.keys(state.injectedValidations);
  const validationsKeys = Object.keys(state.validations);

  if (injectedValidationsKeys.length === 0 && validationsKeys.length === 0) {
    return { ...state, isFormValid: true };
  }

  let issues = injectedValidationsKeys.find(
    (key) =>
      state.injectedValidations[key] !== null && Array.isArray(state.injectedValidations[key]),
  );
  if (issues !== undefined) {
    return { ...state, isFormValid: false };
  }

  issues = validationsKeys.find(
    (key) => state.validations[key] !== null && Array.isArray(state.validations[key]),
  );
  if (issues !== undefined) {
    return { ...state, isFormValid: false };
  }

  return { ...state, isFormValid: true };
}
