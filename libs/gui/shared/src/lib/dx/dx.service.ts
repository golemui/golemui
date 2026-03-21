import * as Core from '@golemui/core';
import { LayoutWidget, UiState } from '@golemui/core';
import { DxDefinitionItem, DxDefinitions, DxResult } from './formDef.domain';
import {
  DxFormConfig,
  FormConfig,
  GslSelector,
  GslSelectorsInput,
  GuiItemTypes,
  ValidGuiShortcut,
} from './core/dx.domain';
import { LayoutEntry } from './shortcuts/layouts/layouts.domain';
import { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
import { _guiSubmitButton } from './shortcuts/actions/guiActions.impl';
import selectorResolver from './core/selectorResolver.service';
import widgetMerger from './core/widgetMerger.service';
import widgetMapper from './core/widgetMapper.service';
import selectorNormalizer, { SelectorNormalizer } from './core/selectorNormalizer.service';
import eventWiringService, { EventRegistry, EventWiringService } from './core/eventWiring.service';
import { ItemWalker } from './core/itemWalker.service';
import stateExpansionService from './core/stateExpansion.service';

// ── Item type registrations (side-effect imports) ──
import './registerAll';

/**
 * The output of {@link DxService.prepareForm}: a fully normalized form
 * ready for the walk-and-map phase.
 *
 * - `defs` — widget definitions, possibly wrapped in a synthetic root layout
 * - `gslSelectors` — normalized selectors (always aggregated shape)
 * - `formConfig` — form-level behavioral settings (auto-submit, auto-stack, onSubmit, etc.)
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
 */
export class DxService {
  constructor(
    private readonly selectorNormalizer: SelectorNormalizer,
    private readonly eventWiring: EventWiringService,
    private readonly walker: ItemWalker,
  ) {}

  processDxFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput = [],
    formConfigInput?: DxFormConfig<STATE_KEYS>,
  ): DxResult<STATE_KEYS, FORM_DATA> {
    // ── 1. Prepare: normalize, auto-submit, auto-stack ──
    const { defs, gslSelectors, formConfig } = this.prepareForm(
      dxDefinitionsRaw,
      gslSelectorsInput,
      formConfigInput,
    );

    // ── 2. Walk the _gui* tree and map each widget ──
    const { widgets, eventRegistry } = this.walker.walkAndMap<STATE_KEYS, FORM_DATA>(
      defs,
      gslSelectors,
      formConfig,
    );

    // ── 3. Build result ──
    const rootLayout = widgets[0] as LayoutWidget<STATE_KEYS, FORM_DATA>;
    return this.buildResult<STATE_KEYS, FORM_DATA>(
      { form: rootLayout },
      eventRegistry,
      formConfig,
    );
  }

  /**
   * Normalizes raw form definitions and applies form-level defaults.
   *
   * Steps:
   *  1. Normalize definitions — ensure a flat array; convert bare functions to display widgets.
   *  2. Normalize selectors — convert mixed leaf/aggregated selectors into a uniform
   *     aggregated shape, and extract form-level config (see {@link FormConfig}).
   *  3. Auto-submit — unless suppressed, append a submit button if none was declared.
   *     Throws if more than one submit button is found.
   *  4. Auto-stack — unless suppressed, wrap all definitions in a synthetic root
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
      typeof item === 'function' ? _guiDisplay(item) : item,
    );

    // 2. Normalize selectors + extract form config
    //    Defaults come from extractFormConfig(); third-arg overrides them.
    const gslSelectors = this.selectorNormalizer.normalizeSelectors(gslSelectorsInput);
    const formConfig = {
      ...this.selectorNormalizer.extractFormConfig(),
      ...formConfigInput,
    };

    // 3. Auto-submit
    const submitCount = this.eventWiring.countSubmitButtons(defs);
    if (submitCount > 1) {
      throw new Error(
        `Only one submit button is allowed per form, but ${submitCount} were found. ` +
          `A button is a submit button if it has uid: '#submit' or onClick: 'submit'.`,
      );
    }
    if (!formConfig.suppressAutomaticSubmit && submitCount === 0) {
      defs.push(_guiSubmitButton());
    }

    // 4. Auto-stack: wrap all defs in a synthetic root layout
    if (!formConfig.suppressAutomaticStack) {
      const rootEntry: LayoutEntry = {
        def: { uid: '#root', direction: 'column', widgetName: 'flex' },
        children: defs,
      };
      return {
        defs: [{ type: 'ITEMS', itemType: GuiItemTypes.LAYOUTS, items: [rootEntry], tags: [] }],
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
    form: Core.Form<StateKeys, FormData>,
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
      result.events = (event: Core.FormEvent) => {
        const handler = eventRegistry.get(event.name);
        if (handler) {
          const dxUpdate = (callbackArg: any) => {
            // DX-friendly shape: { path: 'widgetPath', propName: value }
            // translates to OVERRIDE_WIDGET_PROP actions
            if (callbackArg && typeof callbackArg === 'object' && 'path' in callbackArg && !('type' in callbackArg)) {
              const { path, ...props } = callbackArg;
              for (const [prop, value] of Object.entries(props)) {
                event.callback({
                  type: 'OVERRIDE_WIDGET_PROP',
                  payload: { path, prop, value },
                } as Core.EventHandlerCallback);
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

    if (formConfig.widgetLoaders) {
      result.widgetLoaders = formConfig.widgetLoaders;
    }

    if (formConfig.validateOn) {
      result.validateOn = formConfig.validateOn;
    }

    return result;
  }
}

const walker = new ItemWalker(selectorResolver, widgetMerger, widgetMapper, eventWiringService, stateExpansionService);
const formDefs = new DxService(selectorNormalizer, eventWiringService, walker);
export { formDefs };
