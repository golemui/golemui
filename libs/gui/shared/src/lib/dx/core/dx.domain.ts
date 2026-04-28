import { FunctionWidgetParams, ValidateOn } from '@golemui/core';
import type { WidgetItemDecorator, GslItemType } from '../formDef.domain';
import { Dependencies } from '../../shared';

export type { GslItemType } from '../formDef.domain';

// ═══════════════════════════════════════════════════
// Runtime Function
// ═══════════════════════════════════════════════════

export type RuntimeFunction = (params: FunctionWidgetParams<any>) => any;

// ═══════════════════════════════════════════════════
// GUI Item Type (open — new types register at runtime)
// ═══════════════════════════════════════════════════

export type GuiItemType = string;

export const GuiItemTypes = {
  INPUTS: 'INPUTS',
  ACTIONS: 'ACTIONS',
  LAYOUTS: 'LAYOUTS',
  DISPLAYS: 'DISPLAYS',
  CUSTOM_DISPLAY: 'CUSTOM_DISPLAY',
  CUSTOM_INPUT: 'CUSTOM_INPUT',
  CUSTOM_ACTION: 'CUSTOM_ACTION',
  CUSTOM_LAYOUT: 'CUSTOM_LAYOUT',
} as const satisfies Record<string, string>;

// ═══════════════════════════════════════════════════
// GUI Shortcut Core Shapes
// ═══════════════════════════════════════════════════

// ── Shape 1: Items (base) ──

export interface GuiItemsShortcut {
  type: 'ITEMS';
  itemType: GuiItemType;
  items: unknown[];
  tags: string[];
}

// ── Union (open — sub-interfaces live in each shortcut folder) ──

export type ValidGuiShortcut = GuiItemsShortcut;

// ═══════════════════════════════════════════════════
// GSL Matcher
// ═══════════════════════════════════════════════════

export type GslMatcher = (decorator: WidgetItemDecorator) => boolean;

// ═══════════════════════════════════════════════════
// Leaf Selectors (open — config is generic)
// ═══════════════════════════════════════════════════

export type GslLeafConfig = Record<string, any>;

export interface GslLeafSelector {
  kind: 'leaf';
  selectorType: GslItemType;
  matcher: (decorator: any) => boolean;
  config: GslLeafConfig;
  /** When set by `_gslStates`, config is applied as state-suffixed overrides. */
  targetState?: string;
}

// ═══════════════════════════════════════════════════
// Aggregated Selectors
// ═══════════════════════════════════════════════════

export interface FormConfig {
  suppressAutomaticStack?: boolean;
  suppressAutomaticSubmit?: boolean;
  onSubmit?: (data: any) => void;
  dependencies?: Dependencies;
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  validateOn?: ValidateOn;
  states?: Record<string, string>;
  /**
   * Framework-specific item renderers (e.g. ReactItemRenderer / AngularItemRenderer / LitItemRenderer).
   * Forwarded to the unified <gui-form>; the type is intentionally framework-agnostic
   * here and gets narrowed at the framework wrapper boundary.
   */
  itemRenderers?: Record<string, unknown>;
}

/**
 * Public-facing form config type for `processDxFacade`'s third argument.
 * Generic over state keys — TypeScript enforces that every declared state name
 * has a corresponding expression.
 *
 * Usage: `processDxFacade<typeof states[number], FormData>(defs, selectors, formConfig)`
 */
export type DxFormConfig<S extends string = string> = Omit<FormConfig, 'states'> & {
  states?: Record<S, string>;
};

export interface GslAggregatedSelector {
  kind: 'aggregated';
  matcher: GslMatcher;
  children: GslLeafSelector[];
}

// ═══════════════════════════════════════════════════
// Top-level Selector (what goes in formSelectors[])
// ═══════════════════════════════════════════════════

export type GslSelector = GslAggregatedSelector | GslLeafSelector;

export type GslSelectorsInput = GslSelector | GslSelector[];

// ═══════════════════════════════════════════════════
// Resolved Selectors (output of SelectorResolver)
// ═══════════════════════════════════════════════════

export interface ResolvedSelectors {
  leafSelectors: GslLeafSelector[];
  sensibleDefaults: Record<string, Record<string, any>>;
}

// ═══════════════════════════════════════════════════
// Merge Result (output of WidgetMerger)
// ═══════════════════════════════════════════════════

export type MergeResult =
  | { kind: 'static'; def: Record<string, any> }
  | { kind: 'dynamic'; fn: RuntimeFunction };

