import { FormWidget, FunctionWidgetParams, UiState } from '@golemui/core';
import type { GuiItemType } from './dx.domain';
import { FormConfig, GslSelector, MergeResult, RuntimeFunction, ValidGuiShortcut } from './dx.domain';
import type { DxCommonFields, DxInternalFields } from './dxBase.types';
import type { GslItemType } from '../formDef.domain';
import { SelectorResolver } from './selectorResolver.service';
import { WidgetMerger } from './widgetMerger.service';
import { WidgetMapper } from './widgetMapper.service';
import { ActionIdGenerator, BuildWidgetContext, getItemTypeHandler, ItemTypeHandler, ParsedEntry } from './itemTypeRegistry';

type OnClickRegistry = Map<string, (data: any) => void>;

function createActionIdGenerator(): ActionIdGenerator {
  let count = 0;
  return { next: () => `action_${count++}` };
}
type DecoratorForMatching = DxInternalFields & DxCommonFields;

export interface WalkResult<
  StateKeys extends UiState = never,
  FormData extends Record<string, any> = any,
> {
  widgets: FormWidget<StateKeys, FormData>[];
  onClickRegistry: OnClickRegistry;
}

export class ItemWalker {
  constructor(
    private readonly resolver: SelectorResolver,
    private readonly merger: WidgetMerger,
    private readonly mapper: WidgetMapper,
  ) {}

  walkAndMap<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
    formConfig: FormConfig,
  ): WalkResult<StateKeys, FormData> {
    const onClickRegistry: OnClickRegistry = new Map();
    const actionIdGenerator = createActionIdGenerator();
    const widgets = this.walkItems<StateKeys, FormData>(
      guiShortcuts,
      gslSelectors,
      onClickRegistry,
      formConfig,
      actionIdGenerator,
    );
    return { widgets, onClickRegistry };
  }

  private walkItems<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    guiShortcuts: ValidGuiShortcut[],
    gslSelectors: GslSelector[],
    onClickRegistry: OnClickRegistry,
    formConfig: FormConfig,
    actionIdGenerator: ActionIdGenerator,
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
          formConfig,
          actionIdGenerator,
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
    formConfig: FormConfig,
    actionIdGenerator: ActionIdGenerator,
  ): FormWidget<StateKeys, FormData> {
    const gslItemType: GslItemType = itemType;
    // Look up the type-specific strategy for this widget type (inputs, actions, layouts, etc.).
    // Each widget type registers a handler via defineShortcutType (see ItemTypeHandler for the contract).
    // Examples of registrations showing different capabilities:
    //   - inputs/register.ts   — keyed entries + sensibleDefaults (simplest full example)
    //   - actions/register.ts  — bare entries + afterMerge hook (onClick wiring)
    //   - layouts/register.ts  — compound entries + buildCustomWidget + getChildren (recursive)
    const handler = getItemTypeHandler(itemType);
    const parsed = handler.parseEntry(entry);
    const baseDef = this.buildBaseDef(parsed);

    const decoratorForMatching = this.buildDecoratorForMatching(baseDef, gslItemType, parentTags);
    const resolved = this.resolver.resolve(decoratorForMatching, gslSelectors);
    let mergeResult = this.merger.merge(baseDef, gslItemType, resolved);

    if (handler.afterMerge) {
      mergeResult = handler.afterMerge(mergeResult, { onClickRegistry, formConfig, actionIdGenerator });
    }

    if (handler.buildCustomWidget) {
      const context = this.buildCustomWidgetContext(
        parsed.children, gslSelectors, onClickRegistry, formConfig, actionIdGenerator,
      );
      return this.buildCustomWidget<StateKeys, FormData>(handler, mergeResult, context);
    } else {
      return this.mapper.mapToWidget<StateKeys, FormData>(mergeResult, gslItemType);
    }
  }

  private buildCustomWidgetContext(
    children: ValidGuiShortcut[] | undefined,
    gslSelectors: GslSelector[],
    onClickRegistry: OnClickRegistry,
    formConfig: FormConfig,
    actionIdGenerator: ActionIdGenerator,
  ): BuildWidgetContext {
    return {
      children,
      mapStaticDef: (def, type) => this.mapper.mapStaticDef(def, type),
      walkChildren: (c) =>
        this.walkItems(c, gslSelectors, onClickRegistry, formConfig, actionIdGenerator),
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
