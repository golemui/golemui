import type { EventHandlerCallback, Form, FormEvent } from '@golemui/core';
import { type LayoutWidget, type UiState } from '@golemui/core';
import {
  type DxDefinitionItem,
  type DxDefinitions,
  type DxDisplayRenderFn,
  type DxResult,
} from './formDef.domain';
import {
  type DxFormConfig,
  type FormConfig,
  type GslSelector,
  type GslSelectorsInput,
  type ValidGuiShortcut,
} from './core/dx.domain';
import { SelectorResolver } from './core/selectorResolver.service';
import { WidgetMerger } from './core/widgetMerger.service';
import { WidgetMapper } from './core/widgetMapper.service';
import { SelectorNormalizer } from './core/selectorNormalizer.service';
import eventWiringService, { type EventRegistry } from './core/eventWiring.service';
import { ItemWalker } from './core/itemWalker.service';
import stateExpansionService from './core/stateExpansion.service';
import { type ItemTypeRegistry } from './core/itemTypeRegistry';
import { objectUtils } from './utils/objectUtils.service';

/**
 * The widget-set-specific choices of a DX pipeline. Everything else in the
 * pipeline is generic; these two hooks are where an implementation decides
 * what its form definitions are made of.
 */
export interface DxAdapter {
  /**
   * What a bare function in a form definition becomes — typically the
   * implementation's display shortcut wrapping the render function.
   */
  bareItemToWidget(renderFn: DxDisplayRenderFn): ValidGuiShortcut;
  /**
   * The auto-stack root: wraps all top-level definitions in a synthetic root
   * layout so the form renders as a single vertical container. Must resolve
   * to the reserved `flex` widget type.
   */
  rootEntry(children: ValidGuiShortcut[]): ValidGuiShortcut;
}

/**
 * The output of {@link DxService.prepareForm}: a fully normalized form
 * ready for the walk-and-map phase.
 *
 * - `defs` — widget definitions, possibly wrapped in a synthetic root layout
 * - `gslSelectors` — normalized selectors (always aggregated shape)
 * - `formConfig` — form-level behavioral settings (auto-stack, onSubmit, etc.)
 */
interface PreparedForm {
  defs: ValidGuiShortcut[];
  gslSelectors: GslSelector[];
  formConfig: FormConfig;
}

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * Orchestrates: prepareForm → walkAndMap → buildResult.
 *
 * One instance exists per widget set implementation; build it with
 * {@link createDxService}.
 */
export class DxService {
  constructor(
    private readonly selectorNormalizer: SelectorNormalizer,
    private readonly walker: ItemWalker,
    private readonly adapter: DxAdapter,
  ) {}

  processDxFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput = [],
    formConfigInput?: DxFormConfig<STATE_KEYS>,
  ): DxResult<STATE_KEYS, FORM_DATA> {
    // ── 1. Prepare: normalize, auto-stack ──
    const { defs, gslSelectors, formConfig } = this.prepareForm(
      dxDefinitionsRaw,
      gslSelectorsInput,
      formConfigInput,
    );

    // ── 2. Walk the shortcut tree and map each widget ──
    const { widgets, eventRegistry } = this.walker.walkAndMap<STATE_KEYS, FORM_DATA>(
      defs,
      gslSelectors,
      formConfig,
    );

    // ── 3. Build result ──
    const rootLayout = widgets[0] as LayoutWidget<STATE_KEYS, FORM_DATA>;
    return this.buildResult<STATE_KEYS, FORM_DATA>({ form: rootLayout }, eventRegistry, formConfig);
  }

  /**
   * Normalizes raw form definitions and applies form-level defaults.
   *
   * Steps:
   *  1. Normalize definitions — ensure a flat array; convert bare functions to display widgets.
   *  2. Normalize selectors — convert mixed leaf/aggregated selectors into a uniform
   *     aggregated shape, and extract form-level config (see {@link FormConfig}).
   *  3. Auto-stack — unless suppressed, wrap all definitions in a synthetic root
   *     flex column layout so the form renders as a single vertical container.
   */
  private prepareForm(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput,
    formConfigInput?: FormConfig,
  ): PreparedForm {
    // 1. Normalize definitions
    const rawItems: DxDefinitionItem[] = Array.isArray(dxDefinitionsRaw)
      ? [...dxDefinitionsRaw]
      : [dxDefinitionsRaw];
    const defs: ValidGuiShortcut[] = rawItems.map((item) =>
      typeof item === 'function' ? this.adapter.bareItemToWidget(item) : item,
    );

    // 2. Normalize selectors + extract form config
    //    Defaults come from extractFormConfig(); third-arg overrides them.
    const gslSelectors = this.selectorNormalizer.normalizeSelectors(gslSelectorsInput);
    const formConfig = {
      ...this.selectorNormalizer.extractFormConfig(),
      ...formConfigInput,
    };

    // 3. Auto-stack: wrap all defs in a synthetic root layout
    if (!formConfig.suppressAutomaticStack) {
      return {
        defs: [this.adapter.rootEntry(defs)],
        gslSelectors,
        formConfig,
      };
    }

    return { defs, gslSelectors, formConfig };
  }

  /**
   * Converts DX `$`-separated state names to core's `:`-separated names.
   * E.g. `{ register$adult: 'expr' }` → `{ 'register:adult': 'expr' }`.
   */
  private convertStateNames(states: Record<string, string>): Record<string, string> {
    const converted: Record<string, string> = {};
    for (const [key, value] of Object.entries(states)) {
      converted[key.replace(/\$/g, ':')] = value;
    }
    return converted;
  }

  private buildResult<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    form: Form<StateKeys, FormData>,
    eventRegistry: EventRegistry,
    formConfig: FormConfig,
  ): DxResult<StateKeys, FormData> {
    // Inject states into the core form if provided
    if (formConfig.states && Object.keys(formConfig.states).length > 0) {
      form = {
        ...form,
        states: this.convertStateNames(formConfig.states) as Record<StateKeys, string>,
      };
    }

    const result: DxResult<StateKeys, FormData> = { form };

    if (eventRegistry.size > 0) {
      result.events = (event: FormEvent) => {
        const handler = eventRegistry.get(event.name);
        if (handler) {
          const dxUpdate = (callbackArg: any) => {
            // DX-friendly shape: { path: 'widgetPath', propName: value }
            // translates to OVERRIDE_WIDGET_PROP actions
            if (
              callbackArg &&
              typeof callbackArg === 'object' &&
              'path' in callbackArg &&
              !('type' in callbackArg)
            ) {
              const { path, ...props } = callbackArg;
              for (const [prop, value] of Object.entries(props)) {
                event.callback({
                  type: 'OVERRIDE_WIDGET_PROP',
                  payload: { path, prop, value },
                } as EventHandlerCallback);
              }
            } else {
              // Raw action passthrough (backward compat)
              event.callback(callbackArg);
            }
          };
          const wrappedEvent = {
            ...event,
            callback: dxUpdate,
            update: dxUpdate,
          };
          handler(wrappedEvent);
        }
      };
    }

    if (formConfig.dependencies) {
      result.dependencies = formConfig.dependencies;
    }

    if (formConfig.functions) {
      result.functions = formConfig.functions;
    }

    if (formConfig.widgetLoaders) {
      result.widgetLoaders = formConfig.widgetLoaders;
    }

    if (formConfig.validateOn) {
      result.validateOn = formConfig.validateOn;
    }

    if (formConfig.itemRenderers) {
      result.itemRenderers = formConfig.itemRenderers;
    }

    return result;
  }
}

/**
 * Builds the DX form-definition service of a widget set implementation:
 * the full walk-and-map pipeline bound to the implementation's item type
 * registry and adapter.
 *
 * @example
 * const formDefs = createDxService({ registry: guiRegistry, adapter: guiAdapter });
 * const result = formDefs.processDxFacade(definitions, selectors, config);
 */
export function createDxService(options: {
  registry: ItemTypeRegistry;
  adapter: DxAdapter;
}): DxService {
  const { registry, adapter } = options;
  const walker = new ItemWalker(
    registry,
    new SelectorResolver(registry),
    new WidgetMerger(objectUtils, registry),
    new WidgetMapper(registry),
    eventWiringService,
    stateExpansionService,
  );
  return new DxService(new SelectorNormalizer(), walker, adapter);
}
