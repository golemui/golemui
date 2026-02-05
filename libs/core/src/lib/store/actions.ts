import { FormWidget } from '../form-widget';
import { DotPath, Uid, ValidateOn } from '../shared';
import { FormHealth } from './model';

export type INITIALIZE = {
  type: 'INITIALIZE';
  payload: { formDef: string | Record<string, any>; formName: string };
};

/**
 * Sets the data for the entire form.
 */
export type SET_DATA = {
  type: 'SET_DATA';
  payload: { data: Record<string, any> };
};

/**
 * Sets the i18n language
 */
export type SET_LANGUAGE = {
  type: 'SET_LANGUAGE';
  payload: {
    /**
     * The BCP 47 language tag of the current locale (e.g., 'en-US', 'es', 'fr-CA').
     */
    lang: string;
  };
};

export type ADD_WIDGET = {
  type: 'ADD_WIDGET';
  payload: { widget: FormWidget<string> };
};

export type REMOVE_WIDGET = {
  type: 'REMOVE_WIDGET';
  payload: { uid: Uid };
};

// TODO: rename all _WIDGET_ to _INPUT_ when the widget has a path (it's an input)
/**
 * Sets the default value for a single form widget.
 */
export type SET_WIDGET_INITIAL_DATA = {
  type: 'SET_WIDGET_INITIAL_DATA';
  payload: { path: DotPath; data: any };
};

/**
 * Sets the data for a single form widget.
 */
export type SET_WIDGET_DATA = {
  type: 'SET_WIDGET_DATA';
  payload: { path: DotPath; data: any };
};

/**
 * Overrides a property in a form widget's `props` object.
 */
export type OVERRIDE_WIDGET_PROP = {
  type: 'OVERRIDE_WIDGET_PROP';
  payload: { path: DotPath; prop: string; value: any };
};

export type SET_FORM_HEALTH = {
  type: 'SET_FORM_HEALTH';
  payload: { formHealth: FormHealth };
};

/**
 * Action type indicating an attempt to validate form data.
 *
 * When dispatched, this action triggers validation for the entire form based on
 * the form's validation configuration. However, validation errors will only be
 * displayed for the specific widget identified by the `path` property, which will
 * be marked as _touched_.
 *
 * The actual validation behavior is determined by the form's configuration and
 * may not execute immediately upon dispatch.
 * ```
 */
export type ATTEMPT_VALIDATION = {
  type: 'ATTEMPT_VALIDATION';
  payload: { reason: Exclude<ValidateOn, any[] | 'eager' | 'submit'>; path: DotPath; uid: Uid };
};

/**
 * Action type that validates all form widgets and marks them as _touched_.
 *
 * When dispatched, this action triggers validation for every widget in the form
 * and marks all widgets as _touched_, causing validation errors to be displayed
 * for all invalid widgets regardless of the form's validation configuration.
 *
 * This action is typically dispatched when the user attempts to submit the form,
 * ensuring all validation errors are visible before submission proceeds.
 */
export type VALIDATE_ALL = {
  type: 'VALIDATE_ALL';
};

export type INJECT_VALIDATION_ISSUES = {
  type: 'INJECT_VALIDATION_ISSUES';
  payload: { issues: string[] | null; path: DotPath };
};

export type Action =
  | INITIALIZE
  | SET_LANGUAGE
  | SET_DATA
  | ADD_WIDGET
  | REMOVE_WIDGET
  | SET_WIDGET_INITIAL_DATA
  | SET_WIDGET_DATA
  | OVERRIDE_WIDGET_PROP
  | SET_FORM_HEALTH
  | INJECT_VALIDATION_ISSUES
  | ATTEMPT_VALIDATION
  | VALIDATE_ALL;
