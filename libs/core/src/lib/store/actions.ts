import { FormField } from '../form-field';
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

export type ADD_FIELD = {
  type: 'ADD_FIELD';
  payload: { field: FormField<string> };
};

export type REMOVE_FIELD = {
  type: 'REMOVE_FIELD';
  payload: { uid: Uid };
};

// TODO: rename all _FIELD_ to _CONTROL_ when the field has a path (it's a control)
/**
 * Sets the default value for a single form field.
 */
export type SET_FIELD_INITIAL_DATA = {
  type: 'SET_FIELD_INITIAL_DATA';
  payload: { path: DotPath; data: any };
};

/**
 * Sets the data for a single form field.
 */
export type SET_FIELD_DATA = {
  type: 'SET_FIELD_DATA';
  payload: { path: DotPath; data: any };
};

/**
 * Overrides a property in a form field's `props` object.
 */
export type OVERRIDE_FIELD_PROP = {
  type: 'OVERRIDE_FIELD_PROP';
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
 * displayed for the specific field identified by the `path` property, which will
 * be marked as _touched_.
 *
 * The actual validation behavior is determined by the form's configuration and
 * may not execute immediately upon dispatch.
 * ```
 */
export type ATTEMPT_VALIDATION = {
  type: 'ATTEMPT_VALIDATION';
  payload: { reason: Exclude<ValidateOn, any[] | 'eager' | 'submit'>; path: DotPath };
};

/**
 * Action type that validates all form fields and marks them as _touched_.
 *
 * When dispatched, this action triggers validation for every field in the form
 * and marks all fields as _touched_, causing validation errors to be displayed
 * for all invalid fields regardless of the form's validation configuration.
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
  | SET_DATA
  | ADD_FIELD
  | REMOVE_FIELD
  | SET_FIELD_INITIAL_DATA
  | SET_FIELD_DATA
  | OVERRIDE_FIELD_PROP
  | SET_FORM_HEALTH
  | INJECT_VALIDATION_ISSUES
  | ATTEMPT_VALIDATION
  | VALIDATE_ALL;
