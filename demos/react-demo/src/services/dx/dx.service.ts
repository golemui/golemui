import * as Core from '@golemui/core';
import {
  Form,
  LayoutWidget,
  UiState,
} from '@golemui/core';
import {
  DxDefinitionItem,
  DxDefinitions,
  FormEvents,
} from './formDef.domain';
import {
  GslRootDefaults,
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

type OnClickRegistry = Map<string, (data: any) => void>;

interface PreparedForm {
  defs: ValidGuiShortcut[];
  gslSelectors: GslSelector[];
  rootDefaults: GslRootDefaults;
}

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * Orchestrates: applyFormDefaults → walkAndMap → buildResult.
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
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    // ── 1. Prepare: normalize, auto-submit, auto-stack ──
    const { defs, gslSelectors, rootDefaults } = this.applyFormDefaults(dxDefinitionsRaw, gslSelectorsInput);

    // ── 2. Walk the _gui* tree and map each widget ──
    const onClickRegistry: OnClickRegistry = new Map();
    this.actionOnClick.resetCounter();
    const widgets = this.walker.walkAndMap<STATE_KEYS, FORM_DATA>(defs, gslSelectors, onClickRegistry, rootDefaults);

    // ── 3. Build result ──
    const rootLayout = widgets[0] as LayoutWidget<STATE_KEYS, FORM_DATA>;
    return this.buildResult<STATE_KEYS, FORM_DATA>({ form: rootLayout }, onClickRegistry);
  }

  private applyFormDefaults(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput,
  ): PreparedForm {
    // Normalize raw defs
    const rawItems: DxDefinitionItem[] = Array.isArray(dxDefinitionsRaw)
      ? [...dxDefinitionsRaw]
      : [dxDefinitionsRaw];
    const defs: ValidGuiShortcut[] = rawItems.map((item) =>
      typeof item === 'function' ? _guiDisplay(item) : item,
    );

    // Normalize selectors + extract root defaults
    const gslSelectors = this.selectorNormalizer.normalizeSelectors(gslSelectorsInput);
    const rootDefaults = this.selectorNormalizer.extractRootDefaults(gslSelectors);

    // Auto-submit
    const submitCount = this.actionOnClick.countSubmitButtons(defs);
    if (submitCount > 1) {
      throw new Error(
        `Only one submit button is allowed per form, but ${submitCount} were found. ` +
        `A button is a submit button if it has uid: '#submit' or onClick: 'submit'.`,
      );
    }
    if (!rootDefaults.suppressAutomaticSubmit && submitCount === 0) {
      defs.push(_guiSubmitButton());
    }

    // Auto-stack: wrap all defs in a synthetic root layout
    if (!rootDefaults.suppressAutomaticStack) {
      const rootEntry: LayoutEntry = {
        def: { uid: '#root', direction: 'vertical', widgetName: 'flex' },
        children: defs,
      };
      return {
        defs: [{ type: 'ITEMS', itemType: GuiItemTypes.LAYOUTS, items: [rootEntry], tags: [] }],
        gslSelectors,
        rootDefaults,
      };
    }

    return { defs, gslSelectors, rootDefaults };
  }

  private buildResult<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    form: Form<StateKeys, FormData>,
    onClickRegistry: OnClickRegistry,
  ): Form<StateKeys, FormData> | [Form<StateKeys, FormData>, FormEvents] {
    if (onClickRegistry.size === 0) {
      return form;
    }
    const formEvents: FormEvents = (event: Core.FormEvent) => {
      const handler = onClickRegistry.get(event.name);
      if (handler) {
        handler(event.data);
      }
    };
    return [form, formEvents];
  }
}

const walker = new ItemWalker(selectorResolver, widgetMerger, widgetMapper, actionOnClickService);
const formDefs = new DxService(selectorNormalizer, actionOnClickService, walker);
export default formDefs;
