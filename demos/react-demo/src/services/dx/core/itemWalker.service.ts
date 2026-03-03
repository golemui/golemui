import {
  FormWidget,
  FunctionWidgetParams,
  LayoutWidget,
  UiState,
} from '@golemui/core';
import {
  GslRootDefaults,
  GslSelector,
  GuiItemTypes,
  RuntimeFunction,
  ValidGuiShortcut,
} from './dx.domain';
import type { GuiItemType } from './dx.domain';
import type { GslItemType, WidgetItemDecorator } from '../formDef.domain';
import { LayoutEntry, LayoutDefOrCallback } from '../shortcuts/layouts/layouts.domain';
import { DisplayEntry } from '../shortcuts/display/display.domain';
import { SelectorResolver } from './selectorResolver.service';
import { WidgetMerger } from './widgetMerger.service';
import { WidgetMapper } from './widgetMapper.service';
import { ActionOnClickService } from './actionOnClick.service';
import { getItemTypeHandler } from './itemTypeRegistry';

type OnClickRegistry = Map<string, (data: any) => void>;

export class ItemWalker {
  constructor(
    private readonly resolver: SelectorResolver,
    private readonly merger: WidgetMerger,
    private readonly mapper: WidgetMapper,
    private readonly actionOnClick: ActionOnClickService,
  ) {}

  walkAndMap<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
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
          onClickRegistry,
          rootDefaults,
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
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): FormWidget<StateKeys, FormData> {

    const gslItemType: GslItemType = itemType;

    // ── LAYOUTS: process through pipeline, then attach children ──
    if (itemType === GuiItemTypes.LAYOUTS) {
      return this.processLayoutItem<StateKeys, FormData>(
        entry as LayoutEntry, parentTags, gslSelectors, onClickRegistry, rootDefaults,
      );
    }

    // ── DISPLAYS: process through pipeline (always dynamic) ──
    if (itemType === GuiItemTypes.DISPLAYS) {
      return this.processDisplayItem<StateKeys, FormData>(
        entry as DisplayEntry, parentTags, gslSelectors,
      );
    }

    // ── Generic pipeline (INPUTS, ACTIONS, CALENDAR, etc.) ──
    const handler = getItemTypeHandler(itemType);
    const parsed = handler.parseEntry(entry);
    const baseProvider = parsed.baseDef;

    // Build the baseDef — either static or a RuntimeFunction
    let baseDef: Record<string, any> | RuntimeFunction;
    if (typeof baseProvider === 'function') {
      baseDef = (params: FunctionWidgetParams<any>) => {
        const safeParams = params ?? ({} as FunctionWidgetParams<any>);
        const hotMapping = baseProvider(safeParams);
        return parsed.path != null ? { ...hotMapping, path: parsed.path } : hotMapping;
      };
    } else {
      baseDef = parsed.path != null ? { ...baseProvider, path: parsed.path } : baseProvider;
    }

    // Populate decorator properties for selector matching
    const decoratorForMatching = this.buildDecoratorForMatching(baseDef, gslItemType, parentTags);

    // Resolve applicable selectors
    const resolved = this.resolver.resolve(decoratorForMatching, gslSelectors);

    // Merge (handles both static and runtime baseDef)
    let mergeResult = this.merger.merge(baseDef, gslItemType, resolved);

    // Extract onClick from action defs (after merge so GSL decorators are included)
    if (itemType === GuiItemTypes.ACTIONS) {
      mergeResult = this.actionOnClick.extractOnClickFromMergeResult(mergeResult, onClickRegistry, rootDefaults);
    }

    // Map to core widget (handles both static and dynamic mergeResult)
    return this.mapper.mapToWidget<StateKeys, FormData>(mergeResult, gslItemType);
  }

  private processLayoutItem<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    entry: LayoutEntry,
    parentTags: string[],
    gslSelectors: GslSelector[],
    onClickRegistry: OnClickRegistry,
    rootDefaults: GslRootDefaults,
  ): FormWidget<StateKeys, FormData> {
    const layoutDef = entry.def;
    const baseProvider: LayoutDefOrCallback = layoutDef;

    const baseDef: Record<string, any> | RuntimeFunction = typeof baseProvider === 'function'
      ? (params: FunctionWidgetParams<any>) => baseProvider(params)
      : baseProvider;

    const decoratorForMatching = this.buildDecoratorForMatching(baseDef, 'LAYOUTS', parentTags);

    const resolved = this.resolver.resolve(decoratorForMatching, gslSelectors);
    const mergeResult = this.merger.merge(baseDef, 'LAYOUTS', resolved);

    // Recursively process children
    const children = this.walkAndMap<StateKeys, FormData>(
      entry.children, gslSelectors, onClickRegistry, rootDefaults,
    );

    // Map layout through the pipeline, then attach children
    if (mergeResult.kind === 'static') {
      const mapped = this.mapper.mapStaticDef<StateKeys, FormData>(
        mergeResult.def, 'LAYOUTS',
      ) as LayoutWidget<StateKeys, FormData>;
      return { ...mapped, children };
    }

    // Dynamic layout: wrap the runtime function to attach children after mapping
    const fn = mergeResult.fn;
    return ((params: FunctionWidgetParams<FormData>) => {
      const runtimeDef = fn(params);
      const mapped = this.mapper.mapStaticDef<StateKeys, FormData>(
        runtimeDef, 'LAYOUTS',
      ) as LayoutWidget<StateKeys, FormData>;
      return { ...mapped, children };
    }) as FormWidget<StateKeys, FormData>;
  }

  private processDisplayItem<
    StateKeys extends UiState = never,
    FormData extends Record<string, any> = any,
  >(
    entry: DisplayEntry,
    parentTags: string[],
    gslSelectors: GslSelector[],
  ): FormWidget<StateKeys, FormData> {
    const decoratorForMatching: WidgetItemDecorator = {
      itemType: 'DISPLAYS',
      tags: [...parentTags],
    };
    const resolved = this.resolver.resolve(decoratorForMatching, gslSelectors);
    const mergeResult = this.merger.merge(entry as any, 'DISPLAYS', resolved);

    // Displays are always rendered as function widgets (they need runtime params)
    if (mergeResult.kind === 'static') {
      const displayDef = mergeResult.def as any;
      const fn = ((params?: FunctionWidgetParams<FormData>) => ({
        uid: '',
        kind: 'display' as const,
        type: 'renderer',
        props: { render: displayDef.render(params ?? ({} as FunctionWidgetParams<FormData>)) },
      })) as FormWidget<StateKeys, FormData>;
      return fn;
    }

    const runtimeFn = mergeResult.fn;
    const fn = ((params?: FunctionWidgetParams<FormData>) => {
      const displayDef = runtimeFn(params as any);
      return {
        uid: '',
        kind: 'display' as const,
        type: 'renderer',
        props: { render: displayDef.render(params ?? ({} as FunctionWidgetParams<FormData>)) },
      };
    }) as FormWidget<StateKeys, FormData>;
    return fn;
  }

  private buildDecoratorForMatching(
    baseDef: Record<string, any> | RuntimeFunction,
    itemType: GslItemType,
    parentTags: string[],
  ): WidgetItemDecorator {
    if (typeof baseDef === 'function') {
      return { itemType, tags: [...parentTags] };
    }
    const tags = [...parentTags, ...('tags' in baseDef && baseDef.tags ? baseDef.tags : [])];
    const uid = 'uid' in baseDef ? baseDef.uid : undefined;
    return { itemType, tags, uid };
  }
}
