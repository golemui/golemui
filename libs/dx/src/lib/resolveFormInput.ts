import type { ExpressionFunctions, ValidateOn } from '@golemui/core';
import type { Form } from '@golemui/core';
import type { Dependencies } from './shared';
import type { DxFormConfig, GslSelectorsInput } from './core/dx.domain';
import { type DxService } from './dx.service';
import type { DxDefinitions, FormEvents } from './formDef.domain';

// ===================================================
// resolveFormInput - shared bridge used by every framework's <Form> wrapper.
//
// Accepts either a JSON form definition (string | Record<string, any>) or a
// DX bundle (DxDefinitions + optional selectors/config) and returns a
// uniform shape ready to be forwarded into the framework form component.
//
// Each widget set implementation binds its own instance with
// `createResolveFormInput(itsDxService)` and exports it for its wrappers.
//
// Memoization: `processDxFacade` walks the entire form tree, so the result is
// cached by reference identity of the (defs, selectors, config) triple. Each
// framework wrapper calls this on every render - without memoization a typical
// kitchen-sink form would re-walk hundreds of nodes per keystroke.
// ===================================================

export type FormInput = string | Record<string, any> | DxDefinitions;

/**
 * The uniform shape every framework Form wrapper consumes. Generic over the
 * dependency shape so a widget set implementation hands its form authors the
 * dependency keys its components read (the default is the open
 * {@link Dependencies} record).
 */
export interface ResolvedFormInput<
  FormData extends Record<string, any> = any,
  TDependencies extends Dependencies = Dependencies,
> {
  formDef: string | Record<string, any> | Form<any, FormData>;
  formEvent?: FormEvents;
  dependencies?: TDependencies;
  functions?: ExpressionFunctions;
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
}

/**
 * The bound resolver returned by {@link createResolveFormInput}, carrying the
 * dependency shape of the widget set it was bound to.
 */
export type ResolveFormInputFn<TDependencies extends Dependencies = Dependencies> = <
  FormData extends Record<string, any> = any,
>(
  formDef: FormInput | undefined,
  formSelectors?: GslSelectorsInput,
  formConfig?: DxFormConfig<string, TDependencies>,
) => ResolvedFormInput<FormData, TDependencies>;

/**
 * Heuristic discriminator: a DX bundle is an array of builder shortcuts (each
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

/**
 * Throws on a common mistake: wrapping a gui.* definition in an extra `{ form: ... }`. The outer
 * object is not a DxDefinitions bundle, so it slips past `isDxDefinitions` and would reach core as
 * raw JSON with unresolved `type: 'ITEMS'` items (blank render). Caught here so core stays gui.*-free.
 */
function assertNotWrappedDx(formDef: unknown): void {
  if (!formDef || typeof formDef !== 'object' || Array.isArray(formDef)) {
    return;
  }
  const inner = (formDef as Record<string, unknown>)['form'];
  if (!isDxDefinitions(inner)) {
    return;
  }
  throw new Error(
    '[GolemUI] The gui.* form definition was wrapped in an extra `{ form: ... }` object, so its ' +
      'fields were never resolved. Pass the gui.* array DIRECTLY as formDef (`config={{ formDef: form }}`) ' +
      'and put any named `states` in `formConfig`: `config={{ formDef: form, formConfig: { states } }}`. ' +
      'Do NOT wrap them as a `{ form: [...] }` object.',
  );
}

/**
 * Binds the resolver to a widget set's {@link DxService}.
 *
 * @internal Used by widget set packages to build the `resolveFormInput` their
 * framework Form wrappers consume; not part of the end-user public API.
 */
export function createResolveFormInput<TDependencies extends Dependencies = Dependencies>(
  dxService: DxService<TDependencies>,
): ResolveFormInputFn<TDependencies> {
  // --- Memoization ---
  // Three-level WeakMap keyed by (defs, selectors, config). Falls back to a
  // sentinel for the "selectors omitted" / "config omitted" cases so undefined
  // arguments still hit the cache.
  const NO_SELECTORS = Object.freeze({}) as object;
  const NO_CONFIG = Object.freeze({}) as object;
  type Triple = WeakMap<object, WeakMap<object, ResolvedFormInput<any, TDependencies>>>;
  const cache = new WeakMap<object, Triple>();

  function cacheKey(value: unknown, sentinel: object): object {
    if (value === undefined || value === null) return sentinel;
    if (typeof value === 'object') return value as object;
    // Primitives can't be WeakMap keys; skip the cache by returning a fresh object.
    return {};
  }

  return function resolveFormInput<FormData extends Record<string, any> = any>(
    formDef: FormInput | undefined,
    formSelectors?: GslSelectorsInput,
    formConfig?: DxFormConfig<string, TDependencies>,
  ): ResolvedFormInput<FormData, TDependencies> {
    if (!isDxDefinitions(formDef)) {
      assertNotWrappedDx(formDef);
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
    const cached = byConfig.get(configKey) as
      | ResolvedFormInput<FormData, TDependencies>
      | undefined;
    if (cached) return cached;

    const result = dxService.processDxFacade<never, FormData>(
      formDef as DxDefinitions,
      formSelectors,
      formConfig,
    );
    const resolved: ResolvedFormInput<FormData, TDependencies> = {
      formDef: result.form,
      formEvent: result.events,
      dependencies: result.dependencies,
      functions: result.functions,
      widgetLoaders: result.widgetLoaders,
      validateOn: result.validateOn,
      itemRenderers: result.itemRenderers,
    };
    byConfig.set(configKey, resolved);
    return resolved;
  };
}
