// ===================================================
// @golemui/dx - the generic form-authoring (DX) pipeline
//
// A widget set implementation builds on this package by:
//   1. creating its item type registry (`createItemTypeRegistry`),
//   2. registering one shortcut type per widget type
//      (`defineShortcutType`, or `createShortcutType` + `registerShortcutType`),
//   3. building its selector chain (`createSelectors`) and assembling the
//      whole widget set (`createImplementation`), which bundles the
//      form-definition service (`createDxService`) and the framework bridge
//      (`createResolveFormInput`).
// ===================================================

// --- Item type registry ---

export { ItemTypeRegistry, createItemTypeRegistry } from './lib/core/itemTypeRegistry';
export type {
  ItemTypeHandler,
  ParsedEntry,
  AfterMergeContext,
  BuildWidgetContext,
  EventRegistry,
  EventIdGenerator,
  ShortcutItemKind,
} from './lib/core/itemTypeRegistry';

// --- Shortcut type definition ---

export {
  createShortcutType,
  defineShortcutType,
  registerShortcutType,
} from './lib/core/defineShortcutType';
export type {
  EntryShape,
  SensibleDefaultsSpec,
  ShortcutTypeConfig,
  ShortcutTypeDefinition,
  ShortcutTypeSelectors,
} from './lib/core/defineShortcutType';

// --- Selector chain ---

export { createSelectors } from './lib/core/createSelectors';
export type {
  SelectorFactory,
  SelectorFactoryMap,
  SelectorChain,
  UmbrellaSelectorMethods,
} from './lib/core/createSelectors';

// --- Implementation assembly ---

export { createImplementation } from './lib/createImplementation';
export type { ImplementationConfig, WidgetSetImplementation } from './lib/createImplementation';

// --- Domain types ---

export { GuiItemTypes, UmbrellaItemTypes } from './lib/core/dx.domain';
export type {
  ShortcutItemType,
  GuiItemType,
  ItemsShortcut,
  GuiItemsShortcut,
  ValidShortcut,
  ValidGuiShortcut,
  GslMatcher,
  GslLeafConfig,
  GslLeafSelector,
  GslAggregatedSelector,
  GslSelector,
  GslSelectorsInput,
  FormConfig,
  DxFormConfig,
  ResolvedSelectors,
  MergeResult,
  RuntimeFunction,
  GslItemType,
} from './lib/core/dx.domain';
export type {
  WidgetItemDecorator,
  DxDisplayRenderFn,
  DxDefinitionItem,
  DxDefinitions,
  FormEvents,
  DxResult,
} from './lib/formDef.domain';
export type { Dependencies } from './lib/shared';

// --- Decorator base types ---

export type {
  DxFormEvent,
  DxEventHandler,
  DxInternalFields,
  DxIncludeCondition,
  DxExcludeCondition,
  DxCommonFields,
  DxInputBase,
  DxActionBase,
  DxLayoutBase,
  DxDisplayBase,
} from './lib/core/dxBase.types';

// --- Utility types and helpers ---

export { createGslSelector } from './lib/core/dxUtilityTypes';
export type {
  DxRuntimeParams,
  GslDecoratorCallback,
  DefOrCallback,
  GslConfigBase,
  ShortcutOf,
  GuiShortcutOf,
} from './lib/core/dxUtilityTypes';
export { extractWidgetProps } from './lib/core/dxPropsHelper';
export { buildTypedValidator } from './lib/core/dxValidatorHelper';
export type { DxValidator } from './lib/core/dxValidatorHelper';
export {
  pathToLabel,
  processAutoLabel,
  processAutoPlaceholder,
} from './lib/core/sharedSensibleDefaults.service';
export type {
  LabelSensibleDefaultsConfig,
  PlaceholderSensibleDefaultsConfig,
} from './lib/core/sharedSensibleDefaults.service';
export { withForm } from './lib/core/withForm';

// --- Pipeline services ---

export { SelectorResolver } from './lib/core/selectorResolver.service';
export { WidgetMerger } from './lib/core/widgetMerger.service';
export { WidgetMapper } from './lib/core/widgetMapper.service';
export { ItemWalker } from './lib/core/itemWalker.service';
export type { WalkResult } from './lib/core/itemWalker.service';
export { EventWiringService, probeForHostEventName } from './lib/core/eventWiring.service';
export { default as eventWiringService } from './lib/core/eventWiring.service';
export { StateExpansionService } from './lib/core/stateExpansion.service';
export type { StateData } from './lib/core/stateExpansion.service';
export { SelectorNormalizer } from './lib/core/selectorNormalizer.service';

// --- Form-definition service and framework bridge ---

export { DxService, createDxService } from './lib/dx.service';
export type { DxAdapter } from './lib/dx.service';
export { createResolveFormInput, isDxDefinitions } from './lib/resolveFormInput';
export type { FormInput, ResolvedFormInput, ResolveFormInputFn } from './lib/resolveFormInput';
