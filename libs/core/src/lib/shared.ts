import { FormField } from './form-field';
import { OVERRIDE_FIELD_PROP } from './store/actions';
import { ImmutableRecord } from './utils/types';

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

export type FieldFunctionParams<FormData> = { $form: ImmutableRecord<FormData> };

/**
 * A ReactiveFieldFunction is a field function that is evaluated and then substituted by the produced value.
 */
export type ReactiveFieldFunction<T> = <FormData extends Record<string, any>>(
  api: FieldFunctionParams<FormData>,
) => T;

export interface ReactiveFieldFunctionTree {
  [key: string]: ReactiveFieldFunctionTree | ReactiveFieldFunction<any>;
  props: ReactiveFieldFunctionTree;
}

/**
 * Defines when field validation should run.
 * - `'eager'` validates on `'change'`, `'blur'` and `'submit'`.
 * - When using 'submit', validation triggers when the 'submit' event is emitted. When that happens, all fields are also _touched_ first.
 * ```ts
 * {
 *   widget: 'button',
 *   label: 'Create User',
 *   on: {
 *     click: 'submit',
 *   }
 * }
 * ```
 */
export type ValidateOn = 'eager' | 'change' | 'blur' | 'submit' | ('change' | 'blur' | 'submit')[];

/**
 * The bare minimum validation required for ny validation implementation
 */
export type Validator = { required?: boolean };

/**
 * Represents a form event payload.
 */
export type EventName = string;

/**
 * Actions that can be called back from the event handler callback
 */
export type EventHandlerCallback = OVERRIDE_FIELD_PROP;

export type FormEvent<T = any> = {
  /** The name of the form field that dispatched the event. */
  name: EventName;
  /** The form's data at the moment the event was dispatched. */
  data: Record<string, T>;
  /** Actions that the client can execute to interact with the forms engine from the application scope */
  callback: (action: EventHandlerCallback) => void;
};

/**
 * Control adapter templateData
 */
export type ControlTemplateData<T, V = any> = {
  label?: string;
  value?: T;
  /**
   * validation errors
   */
  errors?: string[];
  validator?: V;
  disabled?: boolean;
  readonly?: boolean;
  touched?: boolean;
};

/**
 * Layout adapter templateData
 */
export type LayoutTemplateData = {
  children: FormField<string>[];
};
