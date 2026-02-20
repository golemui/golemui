import { FunctionWidgetParams } from '@golemui/core';
import type { WidgetItemDecorator, GslItemType } from '../formDef.domain';
import type { InputDecorator, InputSensibleDefaultsConfig, GslInputsConfig } from '../shortcuts/inputs/inputs.domain';
import type { ActionDecorator, ActionSensibleDefaultsConfig, GslActionsConfig } from '../shortcuts/actions/actions.domain';
import type { LayoutDecorator, LayoutSensibleDefaultsConfig, GslLayoutsConfig, LayoutEntry, GuiLayoutItemsShortcut } from '../shortcuts/layouts/layouts.domain';
import type { DisplayDecorator, DisplaySensibleDefaultsConfig, GslDisplaysConfig, DisplayEntry, GuiDisplayItemsShortcut } from '../shortcuts/display/display.domain';
import type { GuiInputsShortcut, InputEntry } from '../shortcuts/inputs/inputs.domain';
import type { GuiActionsShortcut, ActionEntry } from '../shortcuts/actions/actions.domain';

export type { GslItemType } from '../formDef.domain';

// ═══════════════════════════════════════════════════
// Runtime Function
// ═══════════════════════════════════════════════════

export type RuntimeFunction = (params: FunctionWidgetParams<any>) => any;

// ═══════════════════════════════════════════════════
// GUI Item Type (single source of truth)
// ═══════════════════════════════════════════════════

export type GUI_ITEM_TYPE_INPUTS = 'INPUTS';
export type GUI_ITEM_TYPE_ACTIONS = 'ACTIONS';
export type GUI_ITEM_TYPE_LAYOUTS = 'LAYOUTS';
export type GUI_ITEM_TYPE_DISPLAYS = 'DISPLAYS';
export type GuiItemType = GUI_ITEM_TYPE_INPUTS | GUI_ITEM_TYPE_ACTIONS | GUI_ITEM_TYPE_LAYOUTS | GUI_ITEM_TYPE_DISPLAYS;

export const GuiItemTypes: {
  INPUTS: GUI_ITEM_TYPE_INPUTS;
  ACTIONS: GUI_ITEM_TYPE_ACTIONS;
  LAYOUTS: GUI_ITEM_TYPE_LAYOUTS;
  DISPLAYS: GUI_ITEM_TYPE_DISPLAYS;
} = {
  INPUTS: 'INPUTS',
  ACTIONS: 'ACTIONS',
  LAYOUTS: 'LAYOUTS',
  DISPLAYS: 'DISPLAYS',
};

// ═══════════════════════════════════════════════════
// GUI Shortcut Core Shapes
// ═══════════════════════════════════════════════════

// ── Shape 1: Items (base) ──

export interface GuiItemsShortcut {
  type: 'ITEMS';
  itemType: GuiItemType;
  items: InputEntry[] | ActionEntry[] | LayoutEntry[] | DisplayEntry[];
  tags: string[];
}

// ── Union ──

export type ValidGuiShortcut =
  | GuiInputsShortcut
  | GuiActionsShortcut
  | GuiLayoutItemsShortcut
  | GuiDisplayItemsShortcut;

// ═══════════════════════════════════════════════════
// GSL Matcher
// ═══════════════════════════════════════════════════

export type GslMatcher = (decorator: WidgetItemDecorator) => boolean;

// ═══════════════════════════════════════════════════
// Leaf Selectors
// ═══════════════════════════════════════════════════

export type GslLeafConfig = GslInputsConfig | GslActionsConfig | GslLayoutsConfig | GslDisplaysConfig;

export interface GslLeafSelector {
  kind: 'leaf';
  selectorType: GslItemType;
  matcher: (decorator: any) => boolean;
  config: GslLeafConfig;
}

export interface GslInputsLeafSelector extends GslLeafSelector {
  selectorType: 'INPUTS';
  matcher: (decorator: InputDecorator) => boolean;
  config: GslInputsConfig;
}

export interface GslActionsLeafSelector extends GslLeafSelector {
  selectorType: 'ACTIONS';
  matcher: (decorator: ActionDecorator) => boolean;
  config: GslActionsConfig;
}

export interface GslLayoutsLeafSelector extends GslLeafSelector {
  selectorType: 'LAYOUTS';
  matcher: (decorator: LayoutDecorator) => boolean;
  config: GslLayoutsConfig;
}

export interface GslDisplaysLeafSelector extends GslLeafSelector {
  selectorType: 'DISPLAYS';
  matcher: (decorator: DisplayDecorator) => boolean;
  config: GslDisplaysConfig;
}

// ═══════════════════════════════════════════════════
// Aggregated Selectors
// ═══════════════════════════════════════════════════

export interface GslRootDefaults {
  suppressAutomaticStack?: boolean;
  suppressAutomaticSubmit?: boolean;
  onSubmit?: (data: any) => void;
}

export interface GslAggregatedSelector {
  kind: 'aggregated';
  matcher: GslMatcher;
  children: GslLeafSelector[];
  rootDefaults?: GslRootDefaults;
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
  aggregatedInputSensibleDefaults: InputSensibleDefaultsConfig;
  aggregatedActionSensibleDefaults: ActionSensibleDefaultsConfig;
  aggregatedLayoutSensibleDefaults: LayoutSensibleDefaultsConfig;
  aggregatedDisplaySensibleDefaults: DisplaySensibleDefaultsConfig;
}

// ═══════════════════════════════════════════════════
// Merge Result (output of WidgetMerger)
// ═══════════════════════════════════════════════════

export type MergeResult =
  | { kind: 'static'; def: InputDecorator | ActionDecorator | LayoutDecorator | DisplayDecorator }
  | { kind: 'dynamic'; fn: RuntimeFunction };

