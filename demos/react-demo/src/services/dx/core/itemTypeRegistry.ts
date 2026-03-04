import {
  FormWidget,
  NonFunctionWidget,
  UiState,
} from '@golemui/core';
import {
  GslLeafSelector,
  GslRootDefaults,
  MergeResult,
  ValidGuiShortcut,
} from './dx.domain';
import type { GslItemType } from './dx.domain';

// ═══════════════════════════════════════════════════
// Item Type Handler — each shortcut folder implements this
// ═══════════════════════════════════════════════════

export interface ParsedEntry {
  baseDef: any;
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

export interface ItemTypeHandler {
  // Used by selectorResolver: roll up sensible defaults from matching leaf selectors
  rollUpSensibleDefaults(leafSelectors: GslLeafSelector[]): Record<string, any>;

  // Used by widgetMerger: apply sensible defaults to a merged decorator
  applySensibleDefaults(def: Record<string, any>, config: Record<string, any>): Record<string, any>;

  // Used by widgetMapper: map a decorator → core FormWidget
  mapToWidget<StateKeys extends UiState = never, FormData extends Record<string, any> = any>(
    def: Record<string, any>,
  ): NonFunctionWidget<StateKeys, FormData>;

  // Used by itemWalker: extract the base decorator from an entry
  // Returns { baseDef, path? } where path is set for keyed entries (inputs, calendar, etc.)
  parseEntry(entry: any): ParsedEntry;

  afterMerge?(
    mergeResult: MergeResult,
    context: AfterMergeContext,
  ): MergeResult;

  buildWidget?(
    mergeResult: MergeResult,
    context: BuildWidgetContext,
  ): FormWidget;

  getChildren?(entry: any): ValidGuiShortcut[] | undefined;
}

// ═══════════════════════════════════════════════════
// Registry singleton
// ═══════════════════════════════════════════════════

const registry = new Map<string, ItemTypeHandler>();

export function registerItemType(itemType: string, handler: ItemTypeHandler): void {
  if (registry.has(itemType)) {
    throw new Error(`Item type "${itemType}" is already registered.`);
  }
  registry.set(itemType, handler);
}

export function getItemTypeHandler(itemType: string): ItemTypeHandler {
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
