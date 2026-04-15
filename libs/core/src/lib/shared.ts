import { NonFunctionWidget } from './form-widget';
import { I18nTranslator } from './i18n';
import { OVERRIDE_WIDGET_PROP } from './store/actions';
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

/**
 * Represents a generic validation status.
 * Either `null` (there are no validation issues) or an array of issues.
 */
export type ValidationStatus = null | string[];

/**
 * Represents the hierarchical structure of validation errors.
 * Each `key` is a segment of a DotPath:
 * e.g., in '$error.user.profile.name', the scope is '$errors' segments are 'user', 'profile', 'name'
 *
 * @example
 * {
 *   something: null,
 *   user: {
 *    email: ["Invalid format"],
 *    address: { street: ["Required"] }
 *   }
 * }
 */
export type $Errors = {
  [key: string]: ValidationStatus | $Errors;
};

export type WidgetPropertyFunctionParams<FormType extends Record<string, any>> = {
  $form: ImmutableRecord<FormType>;
  translate?: I18nTranslator['translate'];
};

/**
 * A WidgetPropertyFunction is a widget function that is evaluated and then substituted by the produced value.
 */
export type WidgetPropertyFunction<T, FormType extends Record<string, any> = any> = (
  api: WidgetPropertyFunctionParams<FormType>,
) => T;

export type FunctionWidgetParams<FormType> = {
  $form: ImmutableRecord<FormType>;
  errors: ValidationStatus | undefined;
  touched: boolean | undefined;
  translate: I18nTranslator['translate'] | undefined;
};

/**
 * Defines when widget validation should run.
 * - `'eager'` validates on `'change'`, `'blur'` and `'submit'`.
 * - When using 'submit', validation triggers when the 'submit' event is emitted. When that happens, all widgets are also _touched_ first.
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
 * // TODO: should this be removed?
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
export type EventHandlerCallback = OVERRIDE_WIDGET_PROP;

export type FormEvent<T = any> = {
  /** The name of the form widget that dispatched the event. */
  name: EventName;
  /** The form's data at the moment the event was dispatched. */
  data: Record<string, T>;
  /** The detail provided by the widget at the moment the event was dispatched. */
  detail?: any;
  /** Actions that the client can execute to interact with the forms engine from the application scope */
  callback: (action: EventHandlerCallback) => void;
};

/**
 * Control adapter templateData
 */
export type ControlTemplateData<T, V = any> = {
  lang?: string;
  deps?: Record<string, unknown>;
  label?: string;
  value?: T;
  /**
   * A size relative to the container and sibling components
   * @example
   * // This component will measure twice than sibling components with size: 1
   * size: 2
   */
  size?: number;
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
  deps?: Record<string, unknown>;
  /**
   * A size relative to the container and sibling components
   * @example
   * // This component will measure twice than sibling components with size: 1
   * size: 2
   */
  size?: number;
  children: NonFunctionWidget<string>[];
};

/**
 * Display widget adapter templateData
 */
export type DisplayWidgetTemplateData = {
  lang?: string;
  deps?: Record<string, unknown>;
  /**
   * A size relative to the container and sibling components
   * @example
   * // This component will measure twice than sibling components with size: 1
   * size: 2
   */
  size?: number;
};

/**
 * Action widget adapter templateData
 */
export type ActionWidgetTemplateData = {
  lang?: string;
  deps?: Record<string, unknown>;
  label?: string;
  disabled?: boolean;
  /**
   * A size relative to the container and sibling components
   * @example
   * // This component will measure twice than sibling components with size: 1
   * size: 2
   */
  size?: number;
};
