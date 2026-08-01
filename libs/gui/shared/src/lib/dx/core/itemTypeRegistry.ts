import { type FormWidget, type NonFunctionWidget, type UiState } from '@golemui/core';
import { type DxRuntimeParams } from './dxUtilityTypes';
import {
  type GslLeafSelector,
  type FormConfig,
  type MergeResult,
  type ValidGuiShortcut,
} from './dx.domain';
import type { DxCommonFields } from './dxBase.types';
import type { GslItemType } from './dx.domain';

// ═══════════════════════════════════════════════════
// Item Type Handler — each shortcut folder implements this
// ═══════════════════════════════════════════════════

export interface ParsedEntry<TDecorator extends DxCommonFields = DxCommonFields> {
  baseDef: TDecorator | ((params: DxRuntimeParams) => Partial<TDecorator>);
  path?: string;
  children?: ValidGuiShortcut[];
}

import type { FormEvent } from '@golemui/core';

export type EventRegistry = Map<string, (event: FormEvent) => void>;

export interface EventIdGenerator {
  next(): string;
}

export interface AfterMergeContext {
  eventRegistry: EventRegistry;
  formConfig: FormConfig;
  eventIdGenerator: EventIdGenerator;
}

export interface BuildWidgetContext {
  children?: ValidGuiShortcut[];
  mapStaticDef: (def: Record<string, any>, itemType: GslItemType) => NonFunctionWidget;
  walkChildren: (children: ValidGuiShortcut[]) => FormWidget[];
}

/**
 * Strategy interface for a widget type (inputs, actions, layouts, calendars, etc.).
 *
 * The DX pipeline (`ItemWalker.processItem`) is generic — it walks the widget tree,
 * resolves selectors, merges definitions, and maps to framework widgets. But each
 * widget type has its own entry shape, its own sensible defaults, and sometimes
 * custom post-merge or widget-building logic. The handler provides these type-specific
 * behaviors at well-defined extension points in the pipeline:
 *
 *   1. `parseEntry`             — parse raw entry into a normalized `ParsedEntry`
 *   2. `rollUpSensibleDefaults` — aggregate config from matching leaf selectors
 *   3. `applySensibleDefaults`  — apply aggregated config to a merged decorator
 *   4. `mapToWidget`            — map a decorator to a core `FormWidget`
 *   5. `afterMerge` (optional)  — post-merge hook (e.g. actions use this to wire onClick)
 *   6. `buildCustomWidget` (optional) — custom widget building for compound types (e.g. layouts
 *                                  that need to recursively walk children)
 *
 * Shortcut authors do NOT implement this interface directly. Instead, they call
 * {@link defineShortcutType} with a simple config object, and it assembles the full
 * handler and registers it in the global registry.
 *
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

  afterMerge?(mergeResult: MergeResult, context: AfterMergeContext): MergeResult;

  /**
   * Optional override for widget types that need custom construction beyond the
   * generic mapToWidget path. Two flavors:
   *
   * - Compound types (layouts, accordion, tabs, repeater): use `context.walkChildren`
   *   to recursively process child widgets and attach them to the result.
   * - Custom rendering (displays): wrap a render function into a specialized widget
   *   shape that the generic mapper can't produce.
   *
   * If not provided, the pipeline falls back to `mapToWidget` for simple leaf types.
   */
  buildCustomWidget?(mergeResult: MergeResult, context: BuildWidgetContext): FormWidget;

  getChildren?(entry: TEntry): ValidGuiShortcut[] | undefined;
}

// ═══════════════════════════════════════════════════
// Registry singleton
// ═══════════════════════════════════════════════════

/**
 * The widget kind an item type belongs to. Matches the `kind` discriminator of core widgets
 */
export type ShortcutItemKind = NonFunctionWidget['kind'];

const registry = new Map<string, ItemTypeHandler<any, any, any>>();
const kindByItemType = new Map<string, ShortcutItemKind>();

export function registerItemType(
  itemType: string,
  handler: ItemTypeHandler<any, any, any>,
  kind?: ShortcutItemKind,
): void {
  if (registry.has(itemType)) {
    throw new Error(`Item type "${itemType}" is already registered.`);
  }
  registry.set(itemType, handler);
  if (kind) {
    kindByItemType.set(itemType, kind);
  }
}

/**
 * Returns the widget kind declared when the item type was registered, or undefined when it was registered without one
 */
export function getItemTypeKind(itemType: string): ShortcutItemKind | undefined {
  return kindByItemType.get(itemType);
}

/**
 * Returns the names of every registered item type
 */
export function getRegisteredItemTypes(): string[] {
  return [...registry.keys()];
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
