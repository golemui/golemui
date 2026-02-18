import * as Core from '@golemui/core';
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
  DxDefinitionItem,
  DxDefinitions,
  FormEvents,
  InputDecorator,
  PartialInputDefCallback,
} from './formDef.domain';
import {
  GuiDisplayShortcut,
  GuiItemsShortcutType,
  ReadyToMapInputDef,
  ReadyToMapItemDef,
  ValidGuiShortcut,
} from './shortcuts/gui/gui.domain';
import { _guiDisplay } from './shortcuts/gui/shortcuts/guiDisplay.impl';
import { _guiSubmitButton } from './shortcuts/gui/shortcuts/guiSubmitButton.impl';
import {
  GslItemType,
  GslRootDefaults,
  GslSelector,
  GslSelectorsInput,
  GslScopeSelectorType,
  GslWidgetSelector,
  LayoutDecorator,
  MergeResult,
  RuntimeFunction,
} from './shortcuts/gsl/gsl.domain';
import selectorResolver, { SelectorResolver } from './resolver/selectorResolver.service';
import widgetMerger, { WidgetMerger } from './merger/widgetMerger.service';
import widgetMapper, { WidgetMapper } from './mapper/widgetMapper.service';
import { InputDefOrCallback } from './shortcuts/gui/shortcuts/guiFields.impl';

type OnClickRegistry = Map<string, (data: any) => void>;

/**
 * Transforms a developer-friendly form definition into a fully-fledged form definition
 * usable by the framework ({@link Form}<STATE_KEYS, FORM_DATA>).
 *
 * Orchestrates: root defaults → auto-submit → walk _gui* tree → Resolver → Merger → Mapper → auto-stack.
 */
export class DxService {
  private actionCounter = 0;
  constructor(
    private readonly resolver: SelectorResolver,
    private readonly merger: WidgetMerger,
    private readonly mapper: WidgetMapper,
  ) {}

  processDxFacade<STATE_KEYS extends UiState = never, FORM_DATA extends Record<string, any> = any>(
    dxDefinitionsRaw: DxDefinitions,
    gslSelectorsInput: GslSelectorsInput = [],
  ): Form<STATE_KEYS, FORM_DATA> | [Form<STATE_KEYS, FORM_DATA>, FormEvents] {
    const rawItems: DxDefinitionItem[] = Array.isArray(dxDefinitionsRaw)
      ? [...dxDefinitionsRaw]
      : [dxDefinitionsRaw];
    const defs: ValidGuiShortcut[] = rawItems.map((item) =>
      typeof item === 'function' ? _guiDisplay(item) : item,
    );

    // Normalize input to array and wrap bare GslWidgetSelectors into an implicit root scope
    const gslSelectors: GslSelector[] = this.normalizeSelectors(gslSelectorsInput);

    // ── 1. Extract root defaults ──
    const rootDefaults = this.extractRootDefaults(gslSelectors);

    // ── 2. Auto-submit (if not suppressed) ──
    const submitCount = this.countSubmitButtons(defs);
    if (submitCount > 1) {
      throw new Error(
        `Only one submit button is allowed per form, but ${submitCount} were found. ` +
        `A button is a submit button if it has uid: '#submit' or onClick: 'submit'.`,
      );
    }
    if (!rootDefaults.suppressAutomaticSubmit && submitCount === 0) {
      defs.push(_guiSubmitButton());
    }

    // ── 3. Walk the _gui* tree and map each widget ──
    const onClickRegistry: OnClickRegistry = new Map();
    this.actionCounter = 0;
    const widgets = this.walkAndMap<STATE_KEYS, FORM_DATA>(defs, gslSelectors, onClickRegistry, rootDefaults);

    // ── 4. Auto-stack (if not suppressed) ──
    if (!rootDefaults.suppressAutomaticStack) {
      const rootLayoutDef: LayoutDecorator = {
        uid: '#root',
        direction: 'vertical',
        widgetName: 'flex',
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
            type: 'flex',
            props: { direction: 'vertical' },
            children: widgets,
          };
        }
      } else {
        rootLayout = {
          uid: '#root',
          kind: 'layout',
          type: 'flex',
          props: { direction: 'vertical' },
          children: widgets,
        };
      }

      return this.buildResult<STATE_KEYS, FORM_DATA>({ form: rootLayout }, onClickRegistry);
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
      return this.buildResult<STATE_KEYS, FORM_DATA>(
        { form: topLevelLayout as LayoutWidget<STATE_KEYS, FORM_DATA> },
        onClickRegistry,
      );
    }
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

  private walkAndMap<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): FormWidget<StateKeys, FormData>[] {
    return guiShortcuts.flatMap((shortcut) => {
      if (shortcut.type === 'LAYOUT') {
        const children = this.walkAndMap<StateKeys, FormData>(
          shortcut.children,
          gslSelectors,
          onClickRegistry,
          rootDefaults,
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
            onClickRegistry,
            rootDefaults,
          );
        });
      }

      if (shortcut.type === 'DISPLAY') {
        const displayShortcut = shortcut as GuiDisplayShortcut;
        const fn = ((params?: FunctionWidgetParams<FormData>) => ({
          uid: '',
          kind: 'display' as const,
          type: 'renderer',
          props: { render: displayShortcut.render(params ?? ({} as FunctionWidgetParams<FormData>)) },
        })) as FormWidget<StateKeys, FormData>;
        return [fn];
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
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
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
      : [...parentTags, ...('tags' in baseDef && baseDef.tags ? baseDef.tags : [])];

    // Extract uid from static action defs for ID-based selector matching
    const itemUid = typeof baseDef !== 'function' && 'uid' in baseDef ? baseDef.uid : undefined;

    // Resolve applicable selectors
    const resolved = this.resolver.resolve(gslItemType, itemTags, itemUid, gslSelectors);

    // Merge (handles both static and runtime baseDef)
    let mergeResult = this.merger.merge(baseDef, gslItemType, resolved);

    // Extract onClick from action defs (after merge so GSL decorators are included)
    if (itemType === GuiItemsShortcutType.ACTIONS) {
      mergeResult = this.extractOnClickFromMergeResult(mergeResult, onClickRegistry, rootDefaults);
    }

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

  private extractOnClickFromMergeResult(
    mergeResult: MergeResult,
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): MergeResult {
    if (mergeResult.kind === 'dynamic') {
      const originalFn = mergeResult.fn;
      const wrappedFn: RuntimeFunction = (params: FunctionWidgetParams<any>) => {
        const result = originalFn(params) as ActionDecorator & Record<string, any>;
        return this.wireOnClick(result, onClickRegistry, rootDefaults);
      };
      return { kind: 'dynamic', fn: wrappedFn };
    }

    const actionDef = mergeResult.def as ActionDecorator & Record<string, any>;
    const wired = this.wireOnClick(actionDef, onClickRegistry, rootDefaults);
    return { kind: 'static', def: wired as ActionDecorator };
  }

  private wireOnClick(
    actionDef: ActionDecorator & Record<string, any>,
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): Record<string, any> {
    // onClick: 'submit' promotes the button to #submit
    const isSubmit = actionDef.uid === '#submit' || actionDef.onClick === 'submit';
    const actionId = isSubmit ? '#submit' : `action_${this.actionCounter++}`;
    const eventName = isSubmit ? 'submit' : actionId;

    // Resolve the effective onClick callback:
    //   explicit function > rootDefaults.onSubmit (for #submit only) > none
    //   onClick: 'submit' is not a callback — it's a marker, so skip it
    const rawOnClick = actionDef.onClick;
    const explicitCallback = typeof rawOnClick === 'function' ? rawOnClick : undefined;
    const effectiveOnClick = explicitCallback
      ?? (isSubmit ? rootDefaults.onSubmit : undefined);

    if (effectiveOnClick) {
      onClickRegistry.set(eventName, effectiveOnClick);
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionId, on: { click: eventName } };
    }

    if (isSubmit) {
      const { onClick: _, ...rest } = actionDef;
      return { ...rest, uid: actionId, on: { click: 'submit' } };
    }

    return { ...actionDef, uid: actionId };
  }

  private parseFieldKey(inputDef: InputDecorator, key: string): InputDecorator {
    return {
      ...inputDef,
      path: key,
    };
  }

  private countSubmitButtons(defs: ValidGuiShortcut[]): number {
    let count = 0;
    for (const def of defs) {
      if (def.type === 'LAYOUT') {
        count += this.countSubmitButtons(def.children);
      } else if (def.type === 'ITEMS' && def.itemsType === GuiItemsShortcutType.ACTIONS) {
        for (const item of def.items) {
          if (typeof item === 'function') continue;
          const action = item as ActionDecorator;
          if (action.uid === '#submit' || action.onClick === 'submit') {
            count++;
          }
        }
      }
    }
    return count;
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
      onSubmit: (data: any) => console.log('Form submitted:', data),
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
