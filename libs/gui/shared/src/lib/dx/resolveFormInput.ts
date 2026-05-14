import type { ValidateOn } from '@golemui/core';
import * as Core from '@golemui/core';
import type { CustomValidatorSchemas } from '@golemui/gui-validators';
import type { Dependencies } from '../shared';
import type { DxFormConfig, GslSelectorsInput } from './core/dx.domain';
import { formDefs } from './dx.service';
import type { DxDefinitions, FormEvents } from './formDef.domain';

// ═══════════════════════════════════════════════════
// resolveFormInput — shared bridge used by every framework's <Form> wrapper.
//
// Accepts either a JSON form definition (string | Record<string, any>) or a
// DX bundle (DxDefinitions + optional selectors/config) and returns a
// uniform shape ready to be forwarded into `<gui-core-form>` /
// `<React.FormComponent>` / `<gui-core-form>` (Angular).
//
// Memoization: `processDxFacade` walks the entire form tree, so the result is
// cached by reference identity of the (defs, selectors, config) triple. Each
// framework wrapper calls this on every render — without memoization a typical
// kitchen-sink form would re-walk hundreds of nodes per keystroke.
// ═══════════════════════════════════════════════════

export type FormInput = string | Record<string, any> | DxDefinitions;

export interface GuiFormInitConfig {
  formDef: FormInput;
  formSelectors?: GslSelectorsInput;
  formConfig?: DxFormConfig;
  customWidgetLoaders?: Record<string, () => Promise<unknown>>;
  customValidators?: CustomValidatorSchemas;
  data?: Record<string, any>;
  meta?: Record<string, any>;
  middlewares?: Core.Middleware<Core.State, Core.Action>[];
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
  localization?: Core.I18nTranslator;
  dependencies?: Dependencies;
  formName?: string;
}

export interface ResolvedFormInput<FormData extends Record<string, any> = any> {
  formDef: string | Record<string, any> | Core.Form<any, FormData>;
  formEvent?: FormEvents;
  dependencies?: Dependencies;
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
}

/**
 * Heuristic discriminator: a DX bundle is an array of `_gui*` shortcuts (each
 * carrying `type: 'ITEMS'`) or a single such shortcut. JSON form defs are
 * either strings or plain objects with `kind`/`type` at the top level.
 */
export function isDxDefinitions(input: unknown): input is DxDefinitions {
  if (typeof input === 'function') return true;
  if (Array.isArray(input)) {
    return input.length === 0 || input.every(isDxDefinitionItem);
  }
  return isDxDefinitionItem(input);
}

function isDxDefinitionItem(item: unknown): boolean {
  if (typeof item === 'function') return true;
  if (item === null || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return obj['type'] === 'ITEMS' && typeof obj['itemType'] === 'string';
}

// ─── Memoization ───
// Three-level WeakMap keyed by (defs, selectors, config). Falls back to a
// sentinel for the "selectors omitted" / "config omitted" cases so undefined
// arguments still hit the cache.
const NO_SELECTORS = Object.freeze({}) as object;
const NO_CONFIG = Object.freeze({}) as object;
type Triple = WeakMap<object, WeakMap<object, ResolvedFormInput<any>>>;
const cache = new WeakMap<object, Triple>();

function cacheKey(value: unknown, sentinel: object): object {
  if (value === undefined || value === null) return sentinel;
  if (typeof value === 'object') return value as object;
  // Primitives can't be WeakMap keys; skip the cache by returning a fresh object.
  return {};
}

export function resolveFormInput<FormData extends Record<string, any> = any>(
  formDef: FormInput | undefined,
  formSelectors?: GslSelectorsInput,
  formConfig?: DxFormConfig,
): ResolvedFormInput<FormData> {
  if (!isDxDefinitions(formDef)) {
    return { formDef: formDef as string | Record<string, any> };
  }

  const defsKey = cacheKey(formDef, NO_SELECTORS); // defs is always an object/array/fn
  const selectorsKey = cacheKey(formSelectors, NO_SELECTORS);
  const configKey = cacheKey(formConfig, NO_CONFIG);

  let bySelectors = cache.get(defsKey);
  if (!bySelectors) {
    bySelectors = new WeakMap();
    cache.set(defsKey, bySelectors);
  }
  let byConfig = bySelectors.get(selectorsKey);
  if (!byConfig) {
    byConfig = new WeakMap();
    bySelectors.set(selectorsKey, byConfig);
  }
  const cached = byConfig.get(configKey) as ResolvedFormInput<FormData> | undefined;
  if (cached) return cached;

  const result = formDefs.processDxFacade<never, FormData>(
    formDef as DxDefinitions,
    formSelectors,
    formConfig,
  );
  const resolved: ResolvedFormInput<FormData> = {
    formDef: result.form,
    formEvent: result.events,
    dependencies: result.dependencies,
    widgetLoaders: result.widgetLoaders,
    validateOn: result.validateOn,
    itemRenderers: result.itemRenderers,
  };
  byConfig.set(configKey, resolved);
  return resolved;
}
