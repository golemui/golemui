// ===================================================
// createImplementation - one call turns a widget catalog into a widget set
//
// An implementation author builds a registry, a facade of shortcut
// factories, and a selector chain, and this factory assembles the public
// authoring namespace plus the DX service and framework bridge bound to
// the registry and adapter.
// ===================================================

import { type ItemTypeRegistry } from './core/itemTypeRegistry';
import { createDxService, type DxAdapter, type DxService } from './dx.service';
import { createResolveFormInput, type ResolveFormInputFn } from './resolveFormInput';
import { type Dependencies } from './shared';

export interface ImplementationConfig<TFacade extends Record<string, unknown>, TSelectors> {
  /** The implementation's name, e.g. 'gui' or 'kendo'. Used in error messages. */
  name: string;
  /** The registry holding one handler per shortcut type of this widget set. */
  registry: ItemTypeRegistry;
  /**
   * The shortcut factory groups of the public namespace, typically
   * `{ inputs: {...}, actions: {...}, displays: {...}, layouts: {...} }`.
   * Hand-written per implementation: a small literal with full inference.
   * Must not contain a `selectors` key, that slot is filled by the chain.
   */
  facade: TFacade;
  /** The selector chain root built with {@link createSelectors}. */
  selectors: TSelectors;
  /** The widget-set-specific choices of the DX pipeline (see {@link DxAdapter}). */
  adapter: DxAdapter;
}

/**
 * Everything a widget set implementation package exports, assembled by
 * {@link createImplementation}.
 *
 * `TDependencies` is the dependency shape this widget set's components read.
 * It is carried by the form config and the resolved form input, so the
 * implementation's form authors get those keys typed.
 */
export interface WidgetSetImplementation<
  TFacade extends Record<string, unknown>,
  TSelectors,
  TDependencies extends Dependencies = Dependencies,
> {
  /** The implementation's name, as passed to {@link createImplementation}. */
  name: string;
  /** The registry holding one handler per shortcut type of this widget set. */
  registry: ItemTypeRegistry;
  /**
   * The public authoring namespace: the facade groups plus `selectors`.
   * This is what an implementation package exports to form authors (the gui
   * set exports it as `gui`).
   */
  namespace: TFacade & { selectors: TSelectors };
  /**
   * The DX form-definition service bound to the registry and adapter:
   * transforms builder-style definitions into complete core forms.
   */
  formDefs: DxService<TDependencies>;
  /**
   * The memoized framework bridge bound to `formDefs`. The implementation's
   * framework Form wrappers use it to resolve their form input.
   */
  resolveFormInput: ResolveFormInputFn<TDependencies>;
}

/**
 * Assembles a widget set implementation from its parts: the registry, the
 * facade, the selector chain, and the adapter.
 *
 * @example
 * export const kendoImplementation = createImplementation({
 *   name: 'kendo',
 *   registry: kendoRegistry,
 *   facade: {
 *     inputs: { textInput: _kendoTextInput, grid: _kendoGrid },
 *     actions: { button: _kendoButton },
 *     displays: { display: _kendoDisplay },
 *     layouts: { stack: _kendoStack },
 *   },
 *   selectors: kendoSelectors,
 *   adapter: {
 *     bareItemToWidget: (fn) => _kendoDisplay(fn),
 *     rootEntry: (children) => kendoRootStack(children),
 *   },
 * });
 * export const kendo = kendoImplementation.namespace;
 *
 * @example
 * // A widget set whose components read third party services: declare the
 * // dependency shape so form authors get those keys typed on `formConfig`
 * // and on the resolved form input. All three type arguments must be given
 * // together, so name the facade and the selector chain first.
 * const kendoFacade = { inputs: { grid: _kendoGrid } };
 * export const kendoImplementation = createImplementation<
 *   typeof kendoFacade,
 *   typeof kendoSelectors,
 *   KendoDependencies
 * >({ name: 'kendo', registry, facade: kendoFacade, selectors: kendoSelectors, adapter });
 */
export function createImplementation<
  TFacade extends Record<string, unknown>,
  TSelectors,
  TDependencies extends Dependencies = Dependencies,
>(
  config: ImplementationConfig<TFacade, TSelectors>,
): WidgetSetImplementation<TFacade, TSelectors, TDependencies> {
  if ('selectors' in config.facade) {
    throw new Error(
      `The "${config.name}" implementation facade must not contain a "selectors" ` +
        `key: that slot of the namespace is filled by the selector chain.`,
    );
  }

  const formDefs = createDxService<TDependencies>({
    registry: config.registry,
    adapter: config.adapter,
  });

  return {
    name: config.name,
    registry: config.registry,
    namespace: { ...config.facade, selectors: config.selectors },
    formDefs,
    resolveFormInput: createResolveFormInput(formDefs),
  };
}
