import { FormField } from './FormField';
import { OVERRIDE_FIELD_PROP } from './store/actions';

/**
 * The UI state name.
 * To be used with includeIn, excludeFrom and composite property names `{ "label.success": "Message sent successfully", "label.error": "An error occurred" }`
 */
export type UiState = string;

/**
 * A ReactiveExpression is an expression that is evaluated and then substituted by the produced value.
 */
export type ReactiveExpression = string;

/**
 * The path to a json object
 */
export type DotPath = string;

/**
 * The components uid identifier
 */
export type Uid = string;

/**
 * Represents a form event payload.
 */
export type EventName = string;

export type EventHandlerCallback = OVERRIDE_FIELD_PROP;

export type FormEvent = {
  /** The name of the form field that dispatched the event. */
  name: EventName;
  /** The form's data at the moment the event was dispatched. */
  data: Record<string, unknown>;
  /** Actions that the client can execute to interact with the forms engine from the application scope */
  callback: (action: EventHandlerCallback) => void;
};

/**
 * Control adapter templateData
 */
export type ControlTemplateData<T> = {
  label?: string;
  value?: T;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
};

/**
 * Layout adapter templateData
 */
export type LayoutTemplateData = {
  children: FormField<string>[];
};
