import {
  Form,
  FormWidget,
  FunctionWidgetParams,
  LayoutWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import {
  ActionDecorator,
  ActionDefCallback,
  ActionDefOrCallback,
  DxDefinitions,
  FormEvents,
  InputDecorator,
  PartialInputDefCallback,
} from './formDef.domain';
import {
  GuiItemsShortcutType,
  ReadyToMapInputDef,
  ReadyToMapItemDef,
  ValidGuiShortcut,
} from './shortcuts/gui/gui.domain';
import { _guiSubmitButton } from './shortcuts/gui/shortcuts/guiSubmitButton.impl';
import {
  GslItemType,
  GslRootDefaults,
  GslSelector,
  GslSelectorsInput,
  GslScopeSelectorType,
  GslWidgetSelector,
  LayoutDecorator,
  RuntimeFunction,
} from './shortcuts/gsl/gsl.domain';
import selectorResolver, { SelectorResolver } from './resolver/selectorResolver.service';
import widgetMerger, { WidgetMerger } from './merger/widgetMerger.service';
import widgetMapper, { WidgetMapper } from './mapper/widgetMapper.service';
import { InputDefOrCallback } from './shortcuts/gui/shortcuts/guiFields.impl';

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * Orchestrates: root defaults → auto-submit → walk _gui* tree → Resolver → Merger → Mapper → auto-stack.
 */
export class DxService {
  constructor(
    private readonly resolver: SelectorResolver,
    private readonly merger: WidgetMerger,
    private readonly mapper: WidgetMapper,
  ) {}

  processDxFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput = [],
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    const defs: ValidGuiShortcut[] = Array.isArray(dxDefinitionsRaw)
      ? [...dxDefinitionsRaw]
      : [dxDefinitionsRaw];

    // Normalize input to array and wrap bare GslWidgetSelectors into an implicit root scope
    const gslSelectors: GslSelector[] = this.normalizeSelectors(gslSelectorsInput);

    // ── 1. Extract root defaults ──
    const rootDefaults = this.extractRootDefaults(gslSelectors);

    // ── 2. Auto-submit (if not suppressed) ──
    if (!rootDefaults.suppressAutomaticSubmit) {
      const hasAction = defs.some(
        (d) => d.type === 'ITEMS' && d.itemsType === 'ACTIONS',
      );
      if (!hasAction) {
        defs.push(_guiSubmitButton());
      }
    }

    // ── 3. Walk the _gui* tree and map each widget ──
    const widgets = this.walkAndMap<STATE_KEYS, FORM_DATA>(defs, gslSelectors);

    // ── 4. Auto-stack (if not suppressed) ──
    if (!rootDefaults.suppressAutomaticStack) {
      const rootLayoutDef: LayoutDecorator = {
        uid: '#root',
        direction: 'vertical',
        widgetName: 'stack',
      };

      // Apply any _gslLayoutById('#root', ...) selectors
      const resolved = this.resolver.resolve('LAYOUT', [], '#root', gslSelectors);
      let rootLayout: LayoutWidget<STATE_KEYS, FORM_DATA>;

      if (resolved.idSelectors.length > 0) {
        const mergeResult = this.merger.merge(rootLayoutDef, 'LAYOUT', resolved);
        if (mergeResult.kind === 'static') {
          const mapped = this.mapper.mapStaticDef<STATE_KEYS, FORM_DATA>(
            mergeResult.def,
            'LAYOUT',
          ) as LayoutWidget<STATE_KEYS, FORM_DATA>;
          rootLayout = { ...mapped, children: widgets };
        } else {
          rootLayout = {
            uid: '#root',
            kind: 'layout',
            type: 'stack',
            props: { direction: 'vertical' },
            children: widgets,
          };
        }
      } else {
        rootLayout = {
          uid: '#root',
          kind: 'layout',
          type: 'stack',
          props: { direction: 'vertical' },
          children: widgets,
        };
      }

      return { form: rootLayout };
    } else {
      // Validate: user must provide a top-level layout
      const topLevelLayout = widgets.find(
        (w) => typeof w !== 'function' && (w as NonFunctionWidget).kind === 'layout',
      );
      if (!topLevelLayout) {
        throw new Error(
          'suppressAutomaticStack is true but no top-level layout was provided in formDef. ' +
          'Wrap your elements in _guiStack or similar.',
        );
      }
      return { form: topLevelLayout as LayoutWidget<STATE_KEYS, FORM_DATA> };
    }
  }

  private walkAndMap<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
  ): FormWidget<StateKeys, FormData>[] {
    return guiShortcuts.flatMap((shortcut) => {
      if (shortcut.type === 'LAYOUT') {
        const children = this.walkAndMap<StateKeys, FormData>(
          shortcut.children,
          gslSelectors,
        );
        const layout: LayoutWidget<StateKeys, FormData> = {
          uid: '',
          kind: 'layout',
          type: shortcut.layoutRootProps.widgetName,
          props: {
            direction: shortcut.layoutNestedProps.orientation ?? 'vertical',
          },
          children,
        };
        return [layout];
      }

      if (shortcut.type === 'ITEMS') {
        return shortcut.items.map((item) => {
          return this.processItem<StateKeys, FormData>(
            item,
            shortcut.itemsType,
            shortcut.tags,
            gslSelectors,
          );
        });
      }

      throw new Error('Unexpected gui shortcut type');
    });
  }

  private processItem<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    item: ReadyToMapItemDef,
    itemType: GuiItemsShortcutType,
    parentTags: string[],
    gslSelectors: GslSelector[],
  ): FormWidget<StateKeys, FormData> {

    // Extract the base provider (static def or callback)
    let baseProvider: InputDefOrCallback | ActionDefOrCallback;
    if (itemType === GuiItemsShortcutType.INPUTS) {
      const asInput = item as ReadyToMapInputDef;
      baseProvider = asInput.inputDefOrCallback;
    } else {
      baseProvider = item as ActionDefOrCallback;
    }

    const gslItemType: GslItemType = itemType === GuiItemsShortcutType.INPUTS ? 'INPUTS' : 'ACTIONS';

    // Build the baseDef — either static or a RuntimeFunction
    const baseDef: InputDecorator | ActionDecorator | LayoutDecorator | RuntimeFunction = typeof baseProvider === 'function'
      ? this.buildRuntimeBaseDef(item, baseProvider, itemType)
      : this.parseValue(item);

    const itemTags = typeof baseDef === 'function'
      ? [...parentTags]
      : [...parentTags, ...(baseDef.tags ?? [])];

    // Resolve applicable selectors
    const resolved = this.resolver.resolve(gslItemType, itemTags, undefined, gslSelectors);

    // Merge (handles both static and runtime baseDef)
    const mergeResult = this.merger.merge(baseDef, gslItemType, resolved);

    // Map to core widget (handles both static and dynamic mergeResult)
    return this.mapper.mapToWidget<StateKeys, FormData>(mergeResult, gslItemType);
  }

  private buildRuntimeBaseDef(
    item: ReadyToMapItemDef,
    baseProvider: PartialInputDefCallback | ActionDefCallback,
    itemType: GuiItemsShortcutType,
  ): RuntimeFunction {
    return (params: FunctionWidgetParams<any>) => {
      const safeParams = params ?? ({} as FunctionWidgetParams<any>);
      const hotMapping = baseProvider(safeParams);

      return itemType === GuiItemsShortcutType.ACTIONS
        ? hotMapping as ActionDecorator
        : this.parseFieldKey(
            hotMapping as InputDecorator,
            (item as ReadyToMapInputDef).key,
          );
    };
  }

  private parseValue(readyToMapFieldOrAction: ReadyToMapItemDef): ActionDecorator | InputDecorator {
    if ('key' in readyToMapFieldOrAction && 'inputDefOrCallback' in readyToMapFieldOrAction) {
      const inputDefOrCallback = readyToMapFieldOrAction.inputDefOrCallback;
      if (typeof inputDefOrCallback === 'function') {
        throw new Error('Callback functions should be handled before parseValue is called');
      }
      return this.parseFieldKey(inputDefOrCallback, readyToMapFieldOrAction.key);
    }
    if (typeof readyToMapFieldOrAction === 'function') {
      throw new Error('Callback functions should be handled before parseValue is called');
    }
    return readyToMapFieldOrAction;
  }

  private parseFieldKey(inputDef: InputDecorator, key: string): InputDecorator {
    return {
      ...inputDef,
      path: key,
    };
  }

  private isWidgetSelector(item: GslSelector | GslWidgetSelector): item is GslWidgetSelector {
    return item.kind === 'widget';
  }

  private normalizeSelectors(input: GslSelectorsInput): GslSelector[] {
    const items = Array.isArray(input) ? input : [input];

    const gslSelectors: GslSelector[] = [];
    const bareWidgetSelectors: GslWidgetSelector[] = [];

    for (const item of items) {
      if (this.isWidgetSelector(item)) {
        bareWidgetSelectors.push(item);
      } else {
        gslSelectors.push(item);
      }
    }

    if (bareWidgetSelectors.length > 0) {
      gslSelectors.unshift({
        kind: 'scope',
        scopeType: GslScopeSelectorType.ROOT,
        children: bareWidgetSelectors,
      });
    }

    return gslSelectors;
  }

  private extractRootDefaults(selectors: GslSelector[]): GslRootDefaults {
    let defaults: GslRootDefaults = {
      suppressAutomaticStack: false,
      suppressAutomaticSubmit: false,
    };
    for (const sel of selectors) {
      if (sel.kind === 'scope' && sel.scopeType === GslScopeSelectorType.ROOT && sel.rootDefaults) {
        defaults = { ...defaults, ...sel.rootDefaults };
      }
    }
    return defaults;
  }
}

const formDefs = new DxService(selectorResolver, widgetMerger, widgetMapper);
export default formDefs;
