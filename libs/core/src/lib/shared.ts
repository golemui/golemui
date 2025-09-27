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
 * Form event payload
 */
export type EventName = string;
export type FormEvent = {
  name: EventName;
  data: Record<string, any> /*State['data']*/;
};

/**
 * Same as Angular's `Type<T>`
 */
export type Constructor<T = unknown> = new (...args: any[]) => T;
