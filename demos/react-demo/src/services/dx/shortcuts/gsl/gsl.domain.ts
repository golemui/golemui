import { FunctionWidgetParams } from '@golemui/core';
import { ActionDecorator, InputDecorator } from '../../formDef.domain';

// ═══════════════════════════════════════════════════
// Root Sensible Defaults
// ═══════════════════════════════════════════════════

export interface GslRootDefaults {
  suppressAutomaticStack?: boolean;
  suppressAutomaticSubmit?: boolean;
  onSubmit?: (data: any) => void;
}

// ═══════════════════════════════════════════════════
// Layout Decorator (DX-level type for layouts)
// ═══════════════════════════════════════════════════

export interface LayoutDecorator {
  uid?: string;
  direction?: 'vertical' | 'horizontal';
  widgetName?: string;
}

// ═══════════════════════════════════════════════════
// Sensible Defaults Configs (per widget type)
// ═══════════════════════════════════════════════════

export interface InputSensibleDefaultsConfig {
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export type ActionSensibleDefaultsConfig = Record<string, never>;

export type LayoutSensibleDefaultsConfig = Record<string, never>;

// ═══════════════════════════════════════════════════
// Decorator Callbacks
// ═══════════════════════════════════════════════════

export type RuntimeFunction = (params: FunctionWidgetParams<any>) => any;

export type GslInputDecoratorCallback = (current: InputDecorator) => Partial<InputDecorator> | RuntimeFunction;
export type GslActionDecoratorCallback = (current: ActionDecorator) => Partial<ActionDecorator> | RuntimeFunction;
export type GslLayoutDecoratorCallback = (current: LayoutDecorator) => Partial<LayoutDecorator>;

// ═══════════════════════════════════════════════════
// Widget-Type Selector Configs
// ═══════════════════════════════════════════════════

export interface GslInputsConfig {
  decorator?: Partial<InputDecorator> | GslInputDecoratorCallback;
  suppressAutomaticLabels?: boolean;
  suppressAutomaticPlaceholders?: boolean;
}

export interface GslActionsConfig {
  decorator?: Partial<ActionDecorator> | GslActionDecoratorCallback;
}

export interface GslLayoutByIdConfig {
  decorator?: Partial<LayoutDecorator> | GslLayoutDecoratorCallback;
}

export interface GslActionByIdConfig {
  decorator?: Partial<ActionDecorator> | GslActionDecoratorCallback;
}

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
// Scope Selectors (produced by _gslRoot, _gslTag)
// ═══════════════════════════════════════════════════

export enum GslScopeSelectorType {
  ROOT = 'ROOT',
  TAG = 'TAG',
}

export interface GslScopeSelector {
  kind: 'scope';
  scopeType: GslScopeSelectorType;
  tag?: string;
  children: GslWidgetSelector[];
  rootDefaults?: GslRootDefaults;
}

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
