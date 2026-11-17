import type { GslSelectorsInput } from '@golemui/dx';
import type { DxDefinitions } from '../formDef.domain';
import type { DxFormConfig } from '../guiDependencyTypes';

/**
 * A form written with the `gui.*` builder: the same three values that a form component takes in
 * its `config`.
 */
export interface GuiFormSource {
  /** The widgets of the form, built with `gui.*`. */
  formDef: DxDefinitions;
  /** The selectors of the form, built with `gui.selectors`. */
  formSelectors?: GslSelectorsInput;
  /** The form config. Its `states` go into the JSON form. */
  formConfig?: DxFormConfig;
}

/**
 * A widget of a JSON form definition. Keys that are not listed here are allowed, for example
 * `label`, `validator`, `on` or a key with a state suffix such as `label.register`.
 */
export type JsonFormWidget = {
  kind: 'input' | 'layout' | 'display' | 'action';
  type: string;
  uid?: string;
  path?: string;
  props?: Record<string, unknown>;
  children?: JsonFormWidget[];
  [key: string]: unknown;
};

/** A JSON form definition: pass it as `formDef`, or write it to a file with `JSON.stringify`. */
export type JsonFormDefinition = {
  $schema: string;
  /** State name to reactive expression, for example `{ adult: '$form.age >= 18' }`. */
  states?: Record<string, string>;
  form: JsonFormWidget[];
};

/**
 * How a diagnostic affects the JSON form. `error`: a widget is not in the JSON form. `warning`:
 * the widget is in the JSON form, and a part of it needs work by hand. `info`: a note.
 */
export type JsonFormDiagnosticSeverity = 'error' | 'warning' | 'info';

/**
 * The stable identifier of a diagnostic.
 *
 * - `event-handler`: an event handler is a function. The JSON form holds an event name.
 * - `render-function`: a display widget is a render function. The widget is left out.
 * - `callback-widget`: a widget is a callback. The JSON form holds the result of one call.
 * - `callback-failed`: the callback of a widget threw or returned no widget. The widget is left
 *   out.
 * - `function-value`: a value of a widget is a function. The value is left out.
 * - `not-json-value`: a value is not a JSON value, for example a `Date` or a class instance.
 * - `host-config`: a value of the form config is not part of a JSON form.
 * - `root-layout`: the root layout of the form is kept as the one widget of `form`.
 * - `repeated-uid`: two widgets would have the same uid. One of them has another uid, or none.
 */
export type JsonFormDiagnosticCode =
  | 'event-handler'
  | 'render-function'
  | 'callback-widget'
  | 'callback-failed'
  | 'function-value'
  | 'not-json-value'
  | 'host-config'
  | 'root-layout'
  | 'repeated-uid';

/** One thing that the JSON form does not hold in the same way as the `gui.*` form. */
export interface JsonFormDiagnostic {
  severity: JsonFormDiagnosticSeverity;
  code: JsonFormDiagnosticCode;
  message: string;
  /**
   * The JSON Pointer of the place in the JSON form definition, for example `/form/2/on/click`.
   * For a widget that is left out, it is the pointer of the array that would hold the widget.
   * For a value of the form config, it is the empty string.
   */
  pointer: string;
}

/** What {@link toJsonFormDefinition} returns. */
export interface JsonFormResult {
  formDefinition: JsonFormDefinition;
  diagnostics: JsonFormDiagnostic[];
}
