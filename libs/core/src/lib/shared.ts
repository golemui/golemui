import { NonFunctionField } from './form-field';
import { I18nTranslator } from './i18n';
import { OVERRIDE_FIELD_PROP } from './store/actions';
import { ImmutableRecord, LooseObject } from './utils/types';

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
 * Represents a generic validation status.
 * Either `null` (there are no validation issues) or an array of issues.
 */
export type ValidationStatus = null | string[];

export type FieldPropertyFunctionParams<FormData> = {
  $form: ImmutableRecord<FormData>;
  translate?: I18nTranslator['translate'];
};

/**
 * A FieldPropertyFunction is a field function that is evaluated and then substituted by the produced value.
 */
export type FieldPropertyFunction<T, FormData extends Record<string, any> = any> = (
  api: FieldPropertyFunctionParams<FormData>,
) => T;

export type ReactiveFormField = LooseObject<
  {
    props?: Record<string, FieldPropertyFunction<any>>;
    on?: Record<string, FieldPropertyFunction<any>>;
  },
  FieldPropertyFunction<any>
>;

export type FunctionFieldParams<FormData> = {
  $form: ImmutableRecord<FormData>;
  errors?: ValidationStatus;
  translate?: I18nTranslator['translate'];
};

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
export type Validator<V = any> = V;

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
  /** The detail provided by the field at the moment the event was dispatched. */
  detail?: any;
  /** Actions that the client can execute to interact with the forms engine from the application scope */
  callback: (action: EventHandlerCallback) => void;
};

/**
 * Control adapter templateData
 */
export type ControlTemplateData<T, V = any> = {
  lang?: string;
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
  lang?: string;
  children: NonFunctionField<string>[];
};

/**
 * Display field adapter templateData
 */
export type DisplayFieldTemplateData = {
  lang?: string;
};

/**
 * Interactive field adapter templateData
 */
export type InteractiveFieldTemplateData = {
  lang?: string;
  label?: string;
  disabled?: boolean;
};
