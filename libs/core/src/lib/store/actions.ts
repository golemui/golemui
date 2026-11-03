import { type DotPath, type Uid, type ValidateOn } from '../shared';
import { type FormHealth } from './model';

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
 * Sets supplemental runtime context for the form.
 *
 * @param payload.meta An object with contextual data (e.g. session info or external references)
 */
export type SET_META = {
  type: 'SET_META';
  payload: { meta: Record<string, any> };
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

// TODO: rename all _WIDGET_ to _INPUT_ when the widget has a path (it's an input)
/**
 * A row that a repeater control removed. `index` is the position of the row before the removal.
 * An added row needs no report: the control appends it, so no other row changes its position.
 */
export type RepeaterRowChange = { type: 'removed'; index: number };

/**
 * Sets the data for a single form widget.
 *
 * @param payload.rowChange Set it when `data` is the new array of the repeater at `path` after a
 * row removal. The touched state, errors, injected issues and prop overrides of the other rows
 * then move with their rows. Without it they stay at their positions.
 */
export type SET_WIDGET_DATA = {
  type: 'SET_WIDGET_DATA';
  payload: { path: DotPath; data: any; rowChange?: RepeaterRowChange };
};

/**
 * Overwrites a property in a form widget's `props` object.
 * Targets widgets via `path` (for 'control' kinds) or `uid` (for all kinds).
 */
export type OVERRIDE_WIDGET_PROP = {
  type: 'OVERRIDE_WIDGET_PROP';
  payload: { path: DotPath; prop: string; value: any } | { uid: string; prop: string; value: any };
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

/**
 * Sets or clears the injected validation issues of one input.
 *
 * @param payload.reportedByWidget Set by a widget that reports the issue itself, such as a rejected
 * date. A row removal leaves this issue at its position, because rejected text stays in the web
 * component at that position. An issue without this flag moves with its row.
 */
export type INJECT_VALIDATION_ISSUES = {
  type: 'INJECT_VALIDATION_ISSUES';
  payload: { issues: string[] | null; path: DotPath; reportedByWidget?: boolean };
};

export type Action =
  | INITIALIZE
  | SET_LANGUAGE
  | SET_DATA
  | SET_META
  | SET_WIDGET_DATA
  | OVERRIDE_WIDGET_PROP
  | SET_FORM_HEALTH
  | INJECT_VALIDATION_ISSUES
  | ATTEMPT_VALIDATION
  | VALIDATE_ALL;
