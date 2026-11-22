import type {
  Action,
  ExpressionFunctions,
  FormInitConfig,
  I18nTranslator,
  Middleware,
  State,
  ValidateOn,
} from '@golemui/core';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import type { Dependencies } from './shared';

/**
 * The configuration of one form of the GolemUI widget set. Every framework form component
 * (`GuiForm`, `<gui-form>`) takes it as `config`.
 *
 * @example
 * const config: GuiFormInitConfig = {
 *   formDef: {
 *     form: [{ kind: 'input', type: 'textinput', path: 'email', label: 'Email' }],
 *   },
 *   data: { email: 'ada@example.com' },
 * };
 */
export interface GuiFormInitConfig {
  /** The form definition: a JSON document, as an object or as a string. */
  formDef: string | Record<string, any>;
  customWidgetLoaders?: Record<string, () => Promise<unknown>>;
  customValidators?: CustomValidatorSchemas;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  middlewares?: Middleware<State, Action>[];
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
  localization?: I18nTranslator;
  dependencies?: Dependencies;
  /**
   * Pure functions that expressions call under the `$fn` namespace, for example
   * `"text": "Total: {{ $fn.grandTotal($form.lineItems) }}"`.
   */
  functions?: ExpressionFunctions;
  /**
   * How the form treats an expression that the expression check rejects. Defaults to `'warn'`.
   * See `FormInitConfig.expressionPolicy` in `@golemui/core`.
   */
  expressionPolicy?: FormInitConfig['expressionPolicy'];
  /**
   * The name of the form: the id of its `<form>` element and the prefix of every DOM id inside
   * it, so two forms on one page never share an id (`name-textinput` renders as
   * `signup-name-textinput`). Widget uids, form events and `data-cy` attributes do not take it.
   *
   * Optional: without it the form generates one. Set it when the server renders the form, and
   * when CSS or tests select GolemUI elements by id.
   */
  formName?: string;
}
