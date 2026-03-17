import * as Core from '@golemui/core';
import { LayoutWidget, UiState } from '@golemui/core';
import { DxDefinitionItem, DxDefinitions, DxResult } from './formDef.domain';
import {
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
import actionOnClickService, { ActionOnClickService } from './core/actionOnClick.service';
import { ItemWalker } from './core/itemWalker.service';

// ── Item type registrations (side-effect imports) ──
import './registerAll';

type OnClickRegistry = Map<string, (data: any) => void>;

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
    private readonly actionOnClick: ActionOnClickService,
    private readonly walker: ItemWalker,
  ) {}

  processDxFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput = [],
  ): DxResult<STATE_KEYS, FORM_DATA> {
    // ── 1. Prepare: normalize, auto-submit, auto-stack ──
    const { defs, gslSelectors, formConfig } = this.prepareForm(
      dxDefinitionsRaw,
      gslSelectorsInput,
    );

    // ── 2. Walk the _gui* tree and map each widget ──
    const { widgets, onClickRegistry } = this.walker.walkAndMap<STATE_KEYS, FORM_DATA>(
      defs,
      gslSelectors,
      formConfig,
    );

    // ── 3. Build result ──
    const rootLayout = widgets[0] as LayoutWidget<STATE_KEYS, FORM_DATA>;
    return this.buildResult<STATE_KEYS, FORM_DATA>(
      { form: rootLayout },
      onClickRegistry,
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
  ): PreparedForm {
    // 1. Normalize definitions
    const rawItems: DxDefinitionItem[] = Array.isArray(dxDefinitionsRaw)
      ? [...dxDefinitionsRaw]
      : [dxDefinitionsRaw];
    const defs: ValidGuiShortcut[] = rawItems.map((item) =>
      typeof item === 'function' ? _guiDisplay(item) : item,
    );

    // 2. Normalize selectors + extract form config
    const gslSelectors = this.selectorNormalizer.normalizeSelectors(gslSelectorsInput);
    const formConfig = this.selectorNormalizer.extractFormConfig(gslSelectors);

    // 3. Auto-submit
    const submitCount = this.actionOnClick.countSubmitButtons(defs);
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

  private buildResult<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    form: Core.Form<StateKeys, FormData>,
    onClickRegistry: OnClickRegistry,
    formConfig: FormConfig,
  ): DxResult<StateKeys, FormData> {
    const result: DxResult<StateKeys, FormData> = { form };

    if (onClickRegistry.size > 0) {
      result.events = (event: Core.FormEvent) => {
        const handler = onClickRegistry.get(event.name);
        if (handler) {
          handler(event.data);
        }
      };
    }

    if (formConfig.dependencies) {
      result.dependencies = formConfig.dependencies;
    }

    return result;
  }
}

const walker = new ItemWalker(selectorResolver, widgetMerger, widgetMapper);
const formDefs = new DxService(selectorNormalizer, actionOnClickService, walker);
export { formDefs };
