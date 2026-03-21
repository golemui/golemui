import { FormWidget, FunctionWidgetParams, NonFunctionWidget, UiState } from '@golemui/core';
import type { GuiItemType } from './dx.domain';
import { FormConfig, GslSelector, MergeResult, ResolvedSelectors, RuntimeFunction, ValidGuiShortcut } from './dx.domain';
import type { DxCommonFields, DxInternalFields } from './dxBase.types';
import type { GslItemType } from '../formDef.domain';
import { SelectorResolver } from './selectorResolver.service';
import { WidgetMerger } from './widgetMerger.service';
import { WidgetMapper } from './widgetMapper.service';
import { EventIdGenerator, EventRegistry, BuildWidgetContext, getItemTypeHandler, ItemTypeHandler, ParsedEntry } from './itemTypeRegistry';
import { EventWiringService } from './eventWiring.service';
import { StateExpansionService } from './stateExpansion.service';

function createEventIdGenerator(): EventIdGenerator {
  let count = 0;
  return { next: () => `event_${count++}` };
}
type DecoratorForMatching = DxInternalFields & DxCommonFields;

export interface WalkResult<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> {
  widgets: FormWidget<StateKeys, FormData>[];
  eventRegistry: EventRegistry;
}

export class ItemWalker {
  constructor(
    private readonly resolver: SelectorResolver,
    private readonly merger: WidgetMerger,
    private readonly mapper: WidgetMapper,
    private readonly eventWiring: EventWiringService,
    private readonly stateExpansion: StateExpansionService,
  ) {}

  walkAndMap<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
    formConfig: FormConfig,
  ): WalkResult<StateKeys, FormData> {
    const eventRegistry: EventRegistry = new Map();
    const eventIdGenerator = createEventIdGenerator();
    const widgetUidCounter = { value: 0 };
    const widgets = this.walkItems<StateKeys, FormData>(
      guiShortcuts,
      gslSelectors,
      eventRegistry,
      formConfig,
      eventIdGenerator,
      widgetUidCounter,
    );
    return { widgets, eventRegistry };
  }

  private walkItems<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
    eventRegistry: EventRegistry,
    formConfig: FormConfig,
    eventIdGenerator: EventIdGenerator,
    widgetUidCounter: { value: number },
  ): FormWidget<StateKeys, FormData>[] {
    return guiShortcuts.flatMap((shortcut) => {
      if (shortcut.type !== 'ITEMS') {
        throw new Error('Unexpected gui shortcut type');
      }

      return shortcut.items.map((entry) => {
        return this.processItem<StateKeys, FormData>(
          entry,
          shortcut.itemType,
          shortcut.tags,
          gslSelectors,
          eventRegistry,
          formConfig,
          eventIdGenerator,
          widgetUidCounter,
        );
      });
    });
  }

  private processItem<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    entry: any,
    itemType: GuiItemType,
    parentTags: string[],
    gslSelectors: GslSelector[],
    eventRegistry: EventRegistry,
    formConfig: FormConfig,
    eventIdGenerator: EventIdGenerator,
    widgetUidCounter: { value: number },
  ): FormWidget<StateKeys, FormData> {
    const gslItemType: GslItemType = itemType;
    // Look up the type-specific strategy for this widget type (inputs, actions, layouts, etc.).
    const handler = getItemTypeHandler(itemType);
    const parsed = handler.parseEntry(entry);
    const baseDef = this.buildBaseDef(parsed);

    const decoratorForMatching = this.buildDecoratorForMatching(baseDef, gslItemType, parentTags);
    const resolved = this.resolver.resolve(decoratorForMatching, gslSelectors);

    // Separate state-targeted selectors (from _gslStates) from regular ones
    const stateLeafs = resolved.leafSelectors.filter(s => s.targetState != null);
    const regularResolved: ResolvedSelectors = {
      leafSelectors: resolved.leafSelectors.filter(s => s.targetState == null),
      sensibleDefaults: resolved.sensibleDefaults,
    };

    let mergeResult = this.merger.merge(baseDef, gslItemType, regularResolved);

    if (handler.afterMerge) {
      mergeResult = handler.afterMerge(mergeResult, { eventRegistry, formConfig, eventIdGenerator });
    }

    // Universal event wiring: onLoad, onChange, onFilter → core on: { ... }
    mergeResult = this.eventWiring.wireInputLayoutEvents(mergeResult, eventRegistry, eventIdGenerator);

    // Extract states/when from merged def, combine with _gslStates overrides
    const { cleanedResult, stateData } = this.stateExpansion.extractFromMergeResult(mergeResult, stateLeafs);

    let widget: FormWidget<StateKeys, FormData>;
    if (handler.buildCustomWidget) {
      const context = this.buildCustomWidgetContext(
        parsed.children, gslSelectors, eventRegistry, formConfig, eventIdGenerator, widgetUidCounter,
      );
      widget = this.buildCustomWidget<StateKeys, FormData>(handler, cleanedResult, context);
    } else {
      widget = this.mapper.mapToWidget<StateKeys, FormData>(cleanedResult, gslItemType);
    }

    // Assign deterministic uids to widgets that don't have one.
    // Input widgets use their path; others get a counter-based id.
    // This ensures multiple INITIALIZE decodes produce matching uids
    // between flatForm and the rendered form tree.
    if (typeof widget !== 'function') {
      const w = widget as NonFunctionWidget & { path?: string };
      if (!w.uid) {
        w.uid = w.path || `dx_${widgetUidCounter.value++}`;
      }
    }

    // Apply state overrides to the core widget
    if (this.stateExpansion.hasStateData(stateData)) {
      if (typeof widget === 'function') {
        const originalFn = widget;
        widget = ((params: FunctionWidgetParams<any>) => {
          const resolved = originalFn(params) as NonFunctionWidget;
          return this.stateExpansion.applyToWidget(resolved, stateData, eventRegistry, eventIdGenerator);
        }) as FormWidget<StateKeys, FormData>;
      } else {
        widget = this.stateExpansion.applyToWidget(
          widget as NonFunctionWidget, stateData, eventRegistry, eventIdGenerator,
        ) as FormWidget<StateKeys, FormData>;
      }
    }

    return widget;
  }

  private buildCustomWidgetContext(
    children: ValidGuiShortcut[] | undefined,
    gslSelectors: GslSelector[],
    eventRegistry: EventRegistry,
    formConfig: FormConfig,
    eventIdGenerator: EventIdGenerator,
    widgetUidCounter: { value: number },
  ): BuildWidgetContext {
    return {
      children,
      mapStaticDef: (def, type) => this.mapper.mapStaticDef(def, type),
      walkChildren: (c) =>
        this.walkItems(c, gslSelectors, eventRegistry, formConfig, eventIdGenerator, widgetUidCounter),
    };
  }

  private buildCustomWidget<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    handler: ItemTypeHandler,
    mergeResult: MergeResult,
    context: BuildWidgetContext,
  ): FormWidget<StateKeys, FormData> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- caller guards this
    return handler.buildCustomWidget!(mergeResult, context) as FormWidget<StateKeys, FormData>;
  }

  /**
   * Resolves the base definition from a parsed entry, injecting the path for keyed entries.
   * For runtime (function) providers, wraps them to inject the path at evaluation time.
   */
  private buildBaseDef(parsed: ParsedEntry): Record<string, any> | RuntimeFunction {
    const baseProvider = parsed.baseDef;

    if (typeof baseProvider === 'function') {
      return (params: FunctionWidgetParams<any>) => {
        const safeParams = params ?? ({} as FunctionWidgetParams<any>);
        const hotMapping = baseProvider(safeParams);
        return parsed.path != null ? { ...hotMapping, path: parsed.path } : hotMapping;
      };
    }

    return parsed.path != null ? { ...baseProvider, path: parsed.path } : baseProvider;
  }

  private buildDecoratorForMatching(
    baseDef: Record<string, any> | RuntimeFunction,
    itemType: GslItemType,
    parentTags: string[],
  ): DecoratorForMatching {
    if (typeof baseDef === 'function') {
      return { itemType, tags: [...parentTags] };
    }
    const tags = [...parentTags, ...('tags' in baseDef && baseDef['tags'] ? baseDef['tags'] : [])];
    const uid = 'uid' in baseDef ? baseDef['uid'] : undefined;
    return { itemType, tags, uid };
  }
}
