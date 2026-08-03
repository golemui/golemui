import {
  type ExpressionFunctions,
  type FunctionWidgetParams,
  type ValidateOn,
} from '@golemui/core';
import type { WidgetItemDecorator, GslItemType } from '../formDef.domain';
import { type Dependencies } from '../shared';

export type { GslItemType } from '../formDef.domain';

// ===================================================
// Runtime Function
// ===================================================

export type RuntimeFunction = (params: FunctionWidgetParams<any>) => any;

// ===================================================
// Item Type (open, new types register at runtime)
// ===================================================

export type ShortcutItemType = string;

/**
 * Kept as a permanent alias of {@link ShortcutItemType} so pre-refactor
 * imports keep working. New code should use the neutral name.
 */
export type GuiItemType = ShortcutItemType;

/**
 * The four umbrella selector names. They are a fixed cross-implementation
 * convention: an umbrella selector matches every item type registered under
 * its kind, and each name doubles as the item type of an implementation's
 * base batch (for the gui set, `INPUTS` is both the umbrella and the item
 * type of the text, number, and boolean shortcuts).
 */
export const UmbrellaItemTypes = {
  INPUTS: 'INPUTS',
  ACTIONS: 'ACTIONS',
  LAYOUTS: 'LAYOUTS',
  DISPLAYS: 'DISPLAYS',
} as const satisfies Record<string, string>;

/**
 * The umbrella names plus the gui widget set's custom item types. Kept with
 * this exact shape as a permanent compatibility surface; new code should use
 * {@link UmbrellaItemTypes} for the shared names and the implementation's own
 * constants for its vocabulary.
 */
export const GuiItemTypes = {
  ...UmbrellaItemTypes,
  CUSTOM_DISPLAY: 'CUSTOM_DISPLAY',
  CUSTOM_INPUT: 'CUSTOM_INPUT',
  CUSTOM_ACTION: 'CUSTOM_ACTION',
  CUSTOM_LAYOUT: 'CUSTOM_LAYOUT',
} as const satisfies Record<string, string>;

// ===================================================
// Shortcut Core Shapes
// ===================================================

// The base shape every builder shortcut reduces to.

export interface ItemsShortcut {
  type: 'ITEMS';
  itemType: ShortcutItemType;
  items: unknown[];
  tags: string[];
}

/**
 * Kept as a permanent alias of {@link ItemsShortcut} so pre-refactor imports
 * keep working. New code should use the neutral name.
 */
export type GuiItemsShortcut = ItemsShortcut;

// The open union of shortcut shapes (sub-interfaces live in each shortcut folder).

export type ValidShortcut = ItemsShortcut;

/**
 * Kept as a permanent alias of {@link ValidShortcut} so pre-refactor imports
 * keep working. New code should use the neutral name.
 */
export type ValidGuiShortcut = ValidShortcut;

// ===================================================
// GSL Matcher
// ===================================================

export type GslMatcher = (decorator: WidgetItemDecorator) => boolean;

// ===================================================
// Leaf Selectors (open - config is generic)
// ===================================================

export type GslLeafConfig = Record<string, any>;

export interface GslLeafSelector {
  kind: 'leaf';
  selectorType: GslItemType;
  matcher: (decorator: any) => boolean;
  config: GslLeafConfig;
  /** When set by `_gslStates`, config is applied as state-suffixed overrides. */
  targetState?: string;
}

// ===================================================
// Aggregated Selectors
// ===================================================

/**
 * Form-level behavioral settings.
 *
 * Generic over the dependency shape so a widget set implementation can expose
 * its own narrowed dependency keys to form authors. The default is the open
 * {@link Dependencies} record, which is what a caller that does not care about
 * a specific widget set gets.
 */
export interface FormConfig<TDependencies extends Dependencies = Dependencies> {
  suppressAutomaticStack?: boolean;
  dependencies?: TDependencies;
  /**
   * Pure functions callable from reactive expressions under the `$fn` namespace.
   * Functions passed in the wrapper's `config.functions` win on name collisions.
   */
  functions?: ExpressionFunctions;
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  validateOn?: ValidateOn;
  states?: Record<string, string>;
  /**
   * Framework-specific item renderers (e.g. ReactItemRenderer / AngularItemRenderer / LitItemRenderer).
   * Forwarded to the unified <gui-form>, the type is intentionally framework-agnostic
   * here and gets narrowed at the framework wrapper boundary.
   */
  itemRenderers?: Record<string, unknown>;
}

/**
 * Public-facing form config type for `processDxFacade`'s third argument.
 * Generic over state keys - TypeScript enforces that every declared state name
 * has a corresponding expression - and over the dependency shape, which a
 * widget set implementation narrows to the keys its components read.
 *
 * Usage: `processDxFacade<typeof states[number], FormData>(defs, selectors, formConfig)`
 */
export type DxFormConfig<
  S extends string = string,
  TDependencies extends Dependencies = Dependencies,
> = Omit<FormConfig<TDependencies>, 'states'> & {
  states?: Record<S, string>;
};

export interface GslAggregatedSelector {
  kind: 'aggregated';
  matcher: GslMatcher;
  children: GslLeafSelector[];
}

// ===================================================
// Top-level Selector (what goes in formSelectors[])
// ===================================================

export type GslSelector = GslAggregatedSelector | GslLeafSelector;

export type GslSelectorsInput = GslSelector | GslSelector[];

// ===================================================
// Resolved Selectors (output of SelectorResolver)
// ===================================================

export interface ResolvedSelectors {
  leafSelectors: GslLeafSelector[];
  sensibleDefaults: Record<string, Record<string, any>>;
}

// ===================================================
// Merge Result (output of WidgetMerger)
// ===================================================

export type MergeResult =
  | { kind: 'static'; def: Record<string, any> }
  | { kind: 'dynamic'; fn: RuntimeFunction };
