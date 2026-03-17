import { FunctionWidgetParams } from '@golemui/core';
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
}

// ═══════════════════════════════════════════════════
// Aggregated Selectors
// ═══════════════════════════════════════════════════

export interface FormConfig {
  suppressAutomaticStack?: boolean;
  suppressAutomaticSubmit?: boolean;
  onSubmit?: (data: any) => void;
  dependencies?: Dependencies;
}

export interface GslAggregatedSelector {
  kind: 'aggregated';
  matcher: GslMatcher;
  children: GslLeafSelector[];
  formConfig?: FormConfig;
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

