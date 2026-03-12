import {
  FormWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import { DxRuntimeParams } from './dxUtilityTypes';
import {
  GslLeafSelector,
  GslRootDefaults,
  MergeResult,
  ValidGuiShortcut,
} from './dx.domain';
import type { DxCommonFields } from './dxBase.types';
import type { GslItemType } from './dx.domain';

// ═══════════════════════════════════════════════════
// Item Type Handler — each shortcut folder implements this
// ═══════════════════════════════════════════════════

export interface ParsedEntry<
  TDecorator extends DxCommonFields = DxCommonFields,
> {
  baseDef: TDecorator | ((params: DxRuntimeParams) => Partial<TDecorator>);
  path?: string;
  children?: ValidGuiShortcut[];
}

type OnClickRegistry = Map<string, (data: any) => void>;

export interface AfterMergeContext {
  onClickRegistry: OnClickRegistry;
  rootDefaults: GslRootDefaults;
}

export interface BuildWidgetContext {
  children?: ValidGuiShortcut[];
  mapStaticDef: (def: Record<string, any>, itemType: GslItemType) => NonFunctionWidget;
  walkChildren: (children: ValidGuiShortcut[]) => FormWidget[];
}

/**
 * Entry shape taxonomy:
 *
 * 1. Keyed entries — { key, def } — path derived from key
 *    Used by: inputs, future select/radiogroup
 *
 * 2. Bare entries — decorator | callback directly
 *    Used by: actions, calendar, displays
 *
 * 3. Compound entries — { def, children } — container with nested shortcuts
 *    Used by: layouts, future tabs/accordion
 *
 * Each handler declares TEntry to match its shape.
 * There is no shared base type — the shapes are intentionally different.
 * parseEntry(entry: TEntry) is the type-safe boundary.
 */
export interface ItemTypeHandler<
  TEntry = any,
  TDecorator extends DxCommonFields = DxCommonFields,
  TConfig = Record<string, any>,
> {
  // Used by selectorResolver: roll up sensible defaults from matching leaf selectors
  rollUpSensibleDefaults(leafSelectors: GslLeafSelector[]): TConfig;

  // Used by widgetMerger: apply sensible defaults to a merged decorator
  applySensibleDefaults(def: TDecorator, config: TConfig): TDecorator;

  // Used by widgetMapper: map a decorator → core FormWidget
  mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    def: TDecorator,
  ): NonFunctionWidget<StateKeys, FormData>;

  // Used by itemWalker: extract the base decorator from an entry
  // Returns { baseDef, path? } where path is set for keyed entries (inputs, calendar, etc.)
  parseEntry(entry: TEntry): ParsedEntry<TDecorator>;

  afterMerge?(
    mergeResult: MergeResult,
    context: AfterMergeContext,
  ): MergeResult;

  buildWidget?(
    mergeResult: MergeResult,
    context: BuildWidgetContext,
  ): FormWidget;

  getChildren?(entry: TEntry): ValidGuiShortcut[] | undefined;
}

// ═══════════════════════════════════════════════════
// Registry singleton
// ═══════════════════════════════════════════════════

const registry = new Map<string, ItemTypeHandler<any, any, any>>();

export function registerItemType(itemType: string, handler: ItemTypeHandler<any, any, any>): void {
  if (registry.has(itemType)) {
    throw new Error(`Item type "${itemType}" is already registered.`);
  }
  registry.set(itemType, handler);
}

export function getItemTypeHandler(itemType: string): ItemTypeHandler<any, any, any> {
  const handler = registry.get(itemType);
  if (!handler) {
    throw new Error(
      `No handler registered for item type "${itemType}". ` +
      `Did you forget to import the registration module?`,
    );
  }
  return handler;
}

export function hasItemTypeHandler(itemType: string): boolean {
  return registry.has(itemType);
}
