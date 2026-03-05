import * as Core from '@golemui/core';
import { ValidGuiShortcut } from './core/dx.domain';
import { DxCommonFields, DxInternalFields } from './core/dxBase.types';
import { DxRuntimeParams } from './core/dxUtilityTypes';

// ═══════════════════════════════════════════════════
// Base Types (owned here)
// ═══════════════════════════════════════════════════

export type GslItemType = string;

/**
 * @deprecated Use DxCommonFields (+ kind-specific DxInputBase/DxActionBase/etc.)
 * for public decorator interfaces. Use DxInternalFields & DxCommonFields for
 * pipeline-internal code that needs the full set.
 *
 * This type is kept as an alias for backward compatibility with pipeline internals.
 */
export type WidgetItemDecorator = DxInternalFields & DxCommonFields;

// ═══════════════════════════════════════════════════
// DX-level aggregate types
// ═══════════════════════════════════════════════════

export type DxDisplayRenderFn = (params: DxRuntimeParams) => any;
export type DxDefinitionItem = ValidGuiShortcut | DxDisplayRenderFn;
export type DxDefinitions = DxDefinitionItem | DxDefinitionItem[];

export type FormEvents = (event: Core.FormEvent) => void;

// ═══════════════════════════════════════════════════
// Re-exports from shortcut folders (backward compat)
// ═══════════════════════════════════════════════════

export type {
  DxInternalFields,
  DxCommonFields,
  DxInputBase,
  DxActionBase,
  DxLayoutBase,
  DxDisplayBase,
} from './core/dxBase.types';

export type {
  DataInputDecorator,
  NumberDataInputValidator,
  NumberDataInputDecorator,
  TextDataInputValidator,
  TextDataInputDecorator,
  BooleanDataInputDecorator,
  InputDecorator,
  ValidShortcutType,
  DxRuntimeParams,
  InputTags,
} from './shortcuts/inputs/inputs.domain';

export type {
  ActionDecorator,
  ActionDefCallback,
  ActionDefOrCallback,
} from './shortcuts/actions/actions.domain';

export type { PasswordDecorator } from './shortcuts/password/password.domain';
export type { CheckboxDecorator } from './shortcuts/checkbox/checkbox.domain';
export type { DateInputDecorator } from './shortcuts/date-input/dateInput.domain';
export type { CurrencyDecorator } from './shortcuts/currency/currency.domain';
export type { RangeCalendarDecorator } from './shortcuts/range-calendar/rangeCalendar.domain';

export type {
  GslDecoratorCallback,
  DefOrCallback,
  GslConfigBase,
  GuiShortcutOf,
} from './core/dxUtilityTypes';
export { createGslSelector } from './core/dxUtilityTypes';
export { defineShortcutType } from './core/defineShortcutType';
export type {
  LabelSensibleDefaultsConfig,
  PlaceholderSensibleDefaultsConfig,
} from './core/sharedSensibleDefaults.service';
export {
  processAutoLabel,
  processAutoPlaceholder,
} from './core/sharedSensibleDefaults.service';
