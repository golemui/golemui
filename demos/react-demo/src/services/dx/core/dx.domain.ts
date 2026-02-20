import { FunctionWidgetParams } from '@golemui/core';
import type { InputDecorator, InputSensibleDefaultsConfig, GslInputsConfig, GuiFieldsShortcut } from '../shortcuts/inputs/inputs.domain';
import type { ActionDecorator, ActionSensibleDefaultsConfig, GslActionsConfig, GslActionByIdConfig, GuiActionsShortcut } from '../shortcuts/actions/actions.domain';
import type { LayoutDecorator, LayoutSensibleDefaultsConfig, GslLayoutByIdConfig, GuiLayoutShortcut } from '../shortcuts/layouts/layouts.domain';
import type { GuiDisplayShortcut } from '../shortcuts/display/display.domain';
import type { GslScopeSelector } from '../shortcuts/scopes/scopes.domain';

// ═══════════════════════════════════════════════════
// Runtime Function
// ═══════════════════════════════════════════════════

export type RuntimeFunction = (params: FunctionWidgetParams<any>) => any;

// ═══════════════════════════════════════════════════
// GUI Shortcut Base Types
// ═══════════════════════════════════════════════════

export enum GuiShortcutType {
  LAYOUT = 'LAYOUT',
  ITEMS = 'ITEMS',
  DISPLAY = 'DISPLAY',
}

export interface GuiShortcut {
  type: GuiShortcutType;
  tags: string[];
}

export enum GuiItemsShortcutType {
  INPUTS = 'INPUTS',
  ACTIONS = 'ACTIONS',
}

export interface GuiItemsShortcut extends GuiShortcut {
  type: GuiShortcutType.ITEMS;
  itemsType: GuiItemsShortcutType;
  items: any[];
}

export type ValidGuiShortcut = GuiFieldsShortcut | GuiLayoutShortcut<any> | GuiActionsShortcut | GuiDisplayShortcut;

// ═══════════════════════════════════════════════════
// Widget Selectors (produced by _gslInputs, _gslActions)
// ═══════════════════════════════════════════════════

export enum GslWidgetSelectorType {
  INPUTS = 'INPUTS',
  ACTIONS = 'ACTIONS',
}

export interface GslWidgetSelector {
  kind: 'widget';
  selectorType: GslWidgetSelectorType;
  config: GslInputsConfig | GslActionsConfig;
}

// ═══════════════════════════════════════════════════
// ID Selectors (produced by _gslLayoutById, _gslActionById)
// ═══════════════════════════════════════════════════

export enum GslIdSelectorType {
  LAYOUT = 'LAYOUT',
  ACTION = 'ACTION',
}

export interface GslIdSelector {
  kind: 'id';
  selectorType: GslIdSelectorType;
  id: string;
  config: GslLayoutByIdConfig | GslActionByIdConfig;
}

// ═══════════════════════════════════════════════════
// Scope Selectors (re-exported from scopes/)
// ═══════════════════════════════════════════════════

export { GslScopeSelectorType, type GslScopeSelector, type GslRootDefaults } from '../shortcuts/scopes/scopes.domain';

// ═══════════════════════════════════════════════════
// Top-level Selector (what goes in formSelectors[])
// ═══════════════════════════════════════════════════

export type GslSelector = GslScopeSelector | GslIdSelector;

export type GslSelectorsInput = GslSelector | GslWidgetSelector | (GslSelector | GslWidgetSelector)[];

// ═══════════════════════════════════════════════════
// Resolved Selectors (output of SelectorResolver)
// ═══════════════════════════════════════════════════

export interface ResolvedSelectors {
  widgetSelectors: GslWidgetSelector[];
  idSelectors: GslIdSelector[];
  aggregatedInputSensibleDefaults: InputSensibleDefaultsConfig;
  aggregatedActionSensibleDefaults: ActionSensibleDefaultsConfig;
  aggregatedLayoutSensibleDefaults: LayoutSensibleDefaultsConfig;
}

// ═══════════════════════════════════════════════════
// Merge Result (output of WidgetMerger)
// ═══════════════════════════════════════════════════

export type MergeResult =
  | { kind: 'static'; def: InputDecorator | ActionDecorator | LayoutDecorator }
  | { kind: 'dynamic'; fn: RuntimeFunction };

// ═══════════════════════════════════════════════════
// Item Type (used across resolver, merger, mapper)
// ═══════════════════════════════════════════════════

export type GslItemType = 'INPUTS' | 'ACTIONS' | 'LAYOUT';

// ═══════════════════════════════════════════════════
// Ready-to-map item types (used by dx.service.ts)
// ═══════════════════════════════════════════════════

export type { ReadyToMapInputDef } from '../shortcuts/inputs/inputs.domain';
export type { ReadyToMapActionDef } from '../shortcuts/actions/actions.domain';

import type { ReadyToMapInputDef } from '../shortcuts/inputs/inputs.domain';
import type { ReadyToMapActionDef } from '../shortcuts/actions/actions.domain';
export type ReadyToMapItemDef = ReadyToMapInputDef | ReadyToMapActionDef;
