import type { ExpressionFunctions, ValidateOn } from '@golemui/core';
import type { Action, I18nTranslator, Middleware, State } from '@golemui/core';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import { createResolveFormInput } from '@golemui/dx';
import type { DxFormConfig, GslSelectorsInput, FormInput } from '@golemui/dx';
import type { Dependencies } from '../shared';
import { formDefs } from './formDefs';

// ═══════════════════════════════════════════════════
// resolveFormInput — the gui-bound bridge used by every framework's <GuiForm>
// wrapper. The generic machinery lives in `@golemui/dx`
// (`createResolveFormInput`); this module binds it to the gui `formDefs`
// service and keeps the moved symbols available from their original paths.
// ═══════════════════════════════════════════════════

export { isDxDefinitions } from '@golemui/dx';
export type { FormInput, ResolvedFormInput } from '@golemui/dx';

export interface GuiFormInitConfig {
  formDef: FormInput;
  formSelectors?: GslSelectorsInput;
  formConfig?: DxFormConfig;
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
   * Pure functions callable from reactive expressions under the `$fn` namespace,
   * e.g. `"text": "Total: {{ $fn.grandTotal($form.lineItems) }}"`.
   * Merged over any functions declared by the DX bundle's `formConfig`;
   * this config wins on name collisions.
   */
  functions?: ExpressionFunctions;
  formName?: string;
}

/**
 * @internal Used by framework Form wrappers, not part of the end-user public API.
 */
export const resolveFormInput = createResolveFormInput(formDefs);
