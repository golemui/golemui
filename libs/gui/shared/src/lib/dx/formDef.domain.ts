// ═══════════════════════════════════════════════════
// The generic DX base types moved to `@golemui/dx`; they stay re-exported
// here permanently so existing import paths keep working. The gui shortcut
// type re-exports below are owned by this package.
// ═══════════════════════════════════════════════════

export type {
  GslItemType,
  WidgetItemDecorator,
  DxDisplayRenderFn,
  DxDefinitionItem,
  DxDefinitions,
  FormEvents,
  DxResult,
} from '@golemui/dx';

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
} from '@golemui/dx';

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
} from '@golemui/dx';
export { createGslSelector } from '@golemui/dx';
export { defineShortcutType } from './registry';
export type { LabelSensibleDefaultsConfig, PlaceholderSensibleDefaultsConfig } from '@golemui/dx';
export { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
