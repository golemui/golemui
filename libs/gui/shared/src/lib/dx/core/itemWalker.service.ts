import {
  FormWidget,
  FunctionWidgetParams,
  UiState,
} from '@golemui/core';
import {
  GslRootDefaults,
  GslSelector,
  RuntimeFunction,
  ValidGuiShortcut,
} from './dx.domain';
import type { DxCommonFields, DxInternalFields } from './dxBase.types';
import type { GuiItemType } from './dx.domain';
import type { GslItemType } from '../formDef.domain';
import { SelectorResolver } from './selectorResolver.service';
import { WidgetMerger } from './widgetMerger.service';
import { WidgetMapper } from './widgetMapper.service';
import { getItemTypeHandler } from './itemTypeRegistry';

type OnClickRegistry = Map<string, (data: any) => void>;
type DecoratorForMatching = DxInternalFields & DxCommonFields;

export class ItemWalker {
  constructor(
    private readonly resolver: SelectorResolver,
    private readonly merger: WidgetMerger,
    private readonly mapper: WidgetMapper,
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

    if (handler.afterMerge) {
      mergeResult = handler.afterMerge(mergeResult, { onClickRegistry, rootDefaults });
    }

    if (handler.buildWidget) {
      return handler.buildWidget(mergeResult, {
        children: parsed.children,
        mapStaticDef: (def, type) => this.mapper.mapStaticDef(def, type),
        walkChildren: (children) => this.walkAndMap(children, gslSelectors, onClickRegistry, rootDefaults),
      }) as FormWidget<StateKeys, FormData>;
    }

    return this.mapper.mapToWidget<StateKeys, FormData>(mergeResult, gslItemType);
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
