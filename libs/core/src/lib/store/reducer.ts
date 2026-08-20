import { errorCodes } from '../errors';
import { type ValidatorFn } from '../form-validator';
import { type InputWidget, isInputWidget } from '../form-widget';
import { type I18nTranslator } from '../i18n';
import { type ExpressionFunctions, type Uid, type ValidateOn } from '../shared';
import { assertNever } from '../utils/assert-never';
import { calculateValidationVariables } from '../utils/form';
import { type Action, type ATTEMPT_VALIDATION, type OVERRIDE_WIDGET_PROP } from './actions';
import { type State } from './model';
import {
  applyDefaultValues,
  calculateCurrentState,
  calculateWidgetFlags,
  calculateWidgetProps,
  dropRemovedWidgetEntries,
  fillCalculatedWidgets,
  initialize,
  injectValidationIssues,
  overrideWidgetProp,
  setData,
  setFormHealth,
  setLanguage,
  setMeta,
  setWidgetData,
  validateAll,
} from './reducers';

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
  const derive = makeDerive(localization, functions);
  const validate = validateAll(validators, localization);
  const applyWidgetProps = calculateWidgetProps(localization, functions);
  // Every action that changes a derive input goes through this wrapper.
  const deriveAndValidateAppearingInputs = (state: State): State =>
    validateInputsAppearingAfterSubmit(state, derive, validate);

  return (state: State, action: Action): State => {
    switch (action.type) {
      case 'INITIALIZE':
        // Decode only. The SET_DATA every binding dispatches next runs the first derive.
        return initialize(state, action);

      case 'SET_DATA':
        return deriveAndValidateAppearingInputs(setData(state, action));

      case 'SET_META':
        return deriveAndValidateAppearingInputs(setMeta(state, action));

      case 'SET_WIDGET_DATA':
        return deriveAndValidateAppearingInputs(setWidgetData(state, action));

      case 'SET_LANGUAGE':
        // A language change only re-resolves translated props.
        return applyWidgetProps(setLanguage(state, action));

      case 'OVERRIDE_WIDGET_PROP': {
        const overridden = overrideWidgetProp(state, action);
        // An unknown target was already warned about, there is nothing to derive.
        if (overridden === state) {
          return state;
        }
        const next = deriveAndValidateAppearingInputs(overridden);
        // An override dispatched from an event handler can change an input, so a touched input is re-validated.
        return overrideTargetsTouchedInput(next, action) ? validate(next) : next;
      }

      case 'SET_FORM_HEALTH':
        return setFormHealth(state, action);

      case 'VALIDATE_ALL':
        return calculateIsFormValid(
          deriveAndValidateAppearingInputs(validate(touchAllInputs(state))),
        );

      case 'ATTEMPT_VALIDATION': {
        if (!shouldValidate(validateOn, action.payload.reason)) {
          return state;
        }
        const touched: State = {
          ...state,
          touched: true,
          touchedControls: { ...state.touchedControls, [action.payload.path]: true },
        };
        return calculateIsFormValid(deriveAndValidateAppearingInputs(validate(touched)));
      }

      case 'INJECT_VALIDATION_ISSUES':
        return injectValidationIssues(state, action);

      default:
        return assertNever(action);
    }
  };
};

// -----------------------------------------------------------------------------
// The derive: everything computed from (formDef, data, meta, overrides, validations, ...)
// -----------------------------------------------------------------------------

/**
 * Error codes the derive itself produces. A form errored with one of them is computed again on the
 * next derive, so it recovers as soon as the data allows. Any other code (decode errors, a widget
 * that could not be loaded) freezes the derive until `SET_FORM_HEALTH` or `INITIALIZE` clears it.
 */
const deriveOwnedErrorCodes = new Set<number>([
  errorCodes.calculateCurrentStateError,
  errorCodes.calculateWidgetFlagsError,
  errorCodes.calculateWidgetPropsError,
  errorCodes.resolveStringInterpolationError,
]);

const erroredOutsideDerive = (state: State): boolean =>
  state.formHealth.status === 'errored' && !deriveOwnedErrorCodes.has(state.formHealth.code);

function makeDerive(localization: I18nTranslator, functions: ExpressionFunctions) {
  const applyCurrentState = calculateCurrentState(functions);
  const applyWidgetFlags = calculateWidgetFlags(functions);
  const applyWidgetProps = calculateWidgetProps(localization, functions);

  return function derive(state: State): State {
    if (erroredOutsideDerive(state)) {
      return state;
    }
    try {
      let next: State =
        state.formHealth.status === 'ok' ? state : { ...state, formHealth: { status: 'ok' } };
      next = applyDefaultValues(next);
      next = dropRemovedWidgetEntries(next);
      const validationVariables = calculateValidationVariables(next);
      next = applyCurrentState(next, validationVariables);
      if (next.formHealth.status !== 'ok') {
        return next;
      }
      next = applyWidgetFlags(next, validationVariables);
      next = fillCalculatedWidgets(next);
      return applyWidgetProps(next, validationVariables);
    } catch (err) {
      // Nothing from this pass is applied, so the last good widgets stay in place.
      const code = errorCodes.calculateWidgetFlagsError;
      return {
        ...state,
        formHealth: { status: 'errored', code, message: `[${code}] ${(err as Error).message}` },
      };
    }
  };
}

// -----------------------------------------------------------------------------
// Inputs that appear after a submit attempt
// -----------------------------------------------------------------------------

/**
 * Runs the derive. When a submit attempt already validated everything (`allControlsValidated`),
 * an input that this derive makes appear (a new repeater row, a revealed field) is touched and
 * validated right away so its errors show without interaction, then the derive runs once more so
 * `$errors`, `$formIsInvalid` and function widgets see the new validation result.
 */
function validateInputsAppearingAfterSubmit(
  state: State,
  derive: (state: State) => State,
  validate: (state: State) => State,
): State {
  const previousSources = state.resolvedSources;
  const previousFlags = state.widgetFlags;
  let next = derive(state);
  if (!next.allControlsValidated || next.formHealth.status !== 'ok') {
    return next;
  }

  const appearing = inputsAppearingIn(next, previousSources, previousFlags);
  if (appearing.length === 0) {
    return next;
  }

  const touchedControls = { ...next.touchedControls };
  for (const uid of appearing) {
    touchedControls[(next.resolvedSources[uid] as InputWidget<unknown, string>).path] = true;
  }
  next = { ...next, touchedControls };
  return calculateIsFormValid(derive(validate(next)));
}

/** The uids of the visible, untouched inputs that are new or were hidden before this derive. */
function inputsAppearingIn(
  next: State,
  previousSources: State['resolvedSources'],
  previousFlags: State['widgetFlags'],
): Uid[] {
  const appearing: Uid[] = [];
  for (const [uid, widget] of Object.entries(next.resolvedSources)) {
    if (!isInputWidget(widget)) {
      continue;
    }
    if (next.widgetFlags[uid]?.hidden === true) {
      continue;
    }
    if (next.touchedControls[widget.path] === true) {
      continue;
    }
    const isNew = previousSources[uid] === undefined;
    const becameVisible = previousFlags[uid]?.hidden === true;
    if (isNew || becameVisible) {
      appearing.push(uid);
    }
  }
  return appearing;
}

// -----------------------------------------------------------------------------
// Validation helpers
// -----------------------------------------------------------------------------

/** Marks the form submitted and replaces the touched set with every visible input path. */
function touchAllInputs(state: State): State {
  const touchedControls: State['touchedControls'] = {};
  for (const { source } of Object.values(state.calculatedWidgets)) {
    if (isInputWidget(source)) {
      touchedControls[source.path] = true;
    }
  }
  return { ...state, touched: true, allControlsValidated: true, touchedControls };
}

function shouldValidate(
  validateOn: ValidateOn,
  reason: ATTEMPT_VALIDATION['payload']['reason'],
): boolean {
  return (
    validateOn === 'eager' || reason === validateOn || (validateOn as string[]).includes(reason)
  );
}

/** True when the override targets an input the user already touched on a touched form. */
function overrideTargetsTouchedInput(state: State, action: OVERRIDE_WIDGET_PROP): boolean {
  if (!state.touched) {
    return false;
  }
  let path: string | undefined;
  if ('path' in action.payload) {
    path = action.payload.path;
  } else {
    const current = state.calculatedWidgets[action.payload.uid]?.current;
    if (current && isInputWidget(current)) {
      path = current.path;
    }
  }
  return path !== undefined && state.touchedControls[path] === true;
}

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
