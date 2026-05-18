import type { Form, FormEvent, UiState } from '@golemui/core';
import { type ValidateOn } from '@golemui/core';
import { type ValidGuiShortcut } from './core/dx.domain';
import { type DxCommonFields, type DxInternalFields } from './core/dxBase.types';
import { type DxRuntimeParams } from './core/dxUtilityTypes';
import { type Dependencies } from '../shared';

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

export type FormEvents = (event: FormEvent) => void;

export interface DxResult<S extends UiState = never, F extends Record<string, any> = any> {
  form: Form<S, F>;
  events?: FormEvents;
  dependencies?: Dependencies;
  widgetLoaders?: Record<string, () => Promise<unknown>>;
  validateOn?: ValidateOn;
  itemRenderers?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════
// Re-exports from shortcut folders (backward compat)
// ═══════════════════════════════════════════════════

export type {
  DxEventHandler,
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
export type { SelectDecorator } from './shortcuts/select/select.domain';
export type { RadiogroupDecorator } from './shortcuts/radiogroup/radiogroup.domain';
export type { TabsDecorator } from './shortcuts/tabs/tabs.domain';
export type { ListDecorator } from './shortcuts/list/list.domain';
export type { AlertDecorator } from './shortcuts/alert/alert.domain';
export type { DatePickerDecorator } from './shortcuts/date-picker/datePicker.domain';
export type { DropdownDecorator } from './shortcuts/dropdown/dropdown.domain';
export type { AccordionDecorator } from './shortcuts/accordion/accordion.domain';
export type { RepeaterDecorator } from './shortcuts/repeater/repeater.domain';
export type { MarkdownDecorator } from './shortcuts/markdown/markdown.domain';
export type { RangeDateInputDecorator } from './shortcuts/range-date-input/rangeDateInput.domain';
export type { RangeDatePickerDecorator } from './shortcuts/range-date-picker/rangeDatePicker.domain';

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
export { processAutoLabel, processAutoPlaceholder } from './core/sharedSensibleDefaults.service';
