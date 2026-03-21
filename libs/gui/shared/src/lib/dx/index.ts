// ═══════════════════════════════════════════════════
// FormForge DX — Public API
// ═══════════════════════════════════════════════════

// ─── GUI factories (structure) ───

export { _guiInputs } from './shortcuts/inputs/guiInputs.impl';
export { _guiTextInput } from './shortcuts/inputs/guiTextInput.impl';
export { _guiNumberInput } from './shortcuts/inputs/guiNumberInput.impl';
export { _guiBooleanInput } from './shortcuts/inputs/guiBooleanInput.impl';
export { _guiCalendar } from './shortcuts/calendar/guiCalendar.impl';
export { _guiTextarea } from './shortcuts/textarea/guiTextarea.impl';
export { _guiPassword } from './shortcuts/password/guiPassword.impl';
export { _guiCheckbox } from './shortcuts/checkbox/guiCheckbox.impl';
export { _guiDateInput } from './shortcuts/date-input/guiDateInput.impl';
export { _guiCurrency } from './shortcuts/currency/guiCurrency.impl';
export { _guiRangeCalendar } from './shortcuts/range-calendar/guiRangeCalendar.impl';
export { _guiSelect } from './shortcuts/select/guiSelect.impl';
export { _guiRadiogroup } from './shortcuts/radiogroup/guiRadiogroup.impl';
export { _guiTabs } from './shortcuts/tabs/guiTabs.impl';
export { _guiList } from './shortcuts/list/guiList.impl';
export { _guiButton, _guiButtons, _guiSubmitButton } from './shortcuts/actions/guiActions.impl';
export { _guiStack, _guiHorizontalStack, _guiVerticalStack } from './shortcuts/layouts/guiStack.impl';
export { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
export { _guiAlert } from './shortcuts/alert/guiAlert.impl';
export { _guiDatePicker } from './shortcuts/date-picker/guiDatePicker.impl';
export { _guiDropdown } from './shortcuts/dropdown/guiDropdown.impl';
export { _guiAccordion } from './shortcuts/accordion/guiAccordion.impl';
export { _guiRepeater } from './shortcuts/repeater/guiRepeater.impl';
export { _guiMarkdown } from './shortcuts/markdown/guiMarkdown.impl';
export { _guiRangeDateInput } from './shortcuts/range-date-input/guiRangeDateInput.impl';
export { _guiRangeDatePicker } from './shortcuts/range-date-picker/guiRangeDatePicker.impl';
export { _guiCustomDisplay } from './shortcuts/custom-display/guiCustomDisplay.impl';
export { _guiCustomInput } from './shortcuts/custom-input/guiCustomInput.impl';
export { _guiCustomAction } from './shortcuts/custom-action/guiCustomAction.impl';
export { _guiCustomLayout } from './shortcuts/custom-layout/guiCustomLayout.impl';

// ─── GSL selectors (behavior) ───

export { _gslInputs, _gslInputById } from './shortcuts/inputs/register';
export { _gslTextInputs, _gslNumberInputs, _gslBooleanInputs } from './shortcuts/inputs/gslInputSubtypes';
export { _gslCalendar, _gslCalendarById } from './shortcuts/calendar/register';
export { _gslTextarea, _gslTextareaById } from './shortcuts/textarea/register';
export { _gslPassword, _gslPasswordById } from './shortcuts/password/register';
export { _gslCheckbox, _gslCheckboxById } from './shortcuts/checkbox/register';
export { _gslDateInput, _gslDateInputById } from './shortcuts/date-input/register';
export { _gslCurrency, _gslCurrencyById } from './shortcuts/currency/register';
export { _gslRangeCalendar, _gslRangeCalendarById } from './shortcuts/range-calendar/register';
export { _gslSelect, _gslSelectById } from './shortcuts/select/register';
export { _gslRadiogroup, _gslRadiogroupById } from './shortcuts/radiogroup/register';
export { _gslTabs, _gslTabsById } from './shortcuts/tabs/register';
export { _gslList, _gslListById } from './shortcuts/list/register';
export { _gslActions, _gslActionById } from './shortcuts/actions/register';
export { _gslLayouts, _gslLayoutById } from './shortcuts/layouts/register';
export { _gslDisplays, _gslDisplayById } from './shortcuts/display/register';
export { _gslAlerts, _gslAlertById } from './shortcuts/alert/register';
export { _gslDatePicker, _gslDatePickerById } from './shortcuts/date-picker/register';
export { _gslDropdown, _gslDropdownById } from './shortcuts/dropdown/register';
export { _gslAccordions, _gslAccordionById } from './shortcuts/accordion/register';
export { _gslRepeaters, _gslRepeaterById } from './shortcuts/repeater/register';
export { _gslMarkdown, _gslMarkdownById } from './shortcuts/markdown/register';
export { _gslRangeDateInput, _gslRangeDateInputById } from './shortcuts/range-date-input/register';
export { _gslRangeDatePicker, _gslRangeDatePickerById } from './shortcuts/range-date-picker/register';
export { _gslCustomDisplays, _gslCustomDisplayById } from './shortcuts/custom-display/register';
export { _gslCustomInputs, _gslCustomInputById } from './shortcuts/custom-input/register';
export { _gslCustomActions, _gslCustomActionById } from './shortcuts/custom-action/register';
export { _gslCustomLayouts, _gslCustomLayoutById } from './shortcuts/custom-layout/register';

// ─── Scope selectors ───

export { _gslRoot } from './shortcuts/scopes/gslRoot.impl';
export { _gslTag } from './shortcuts/scopes/gslTag.impl';
export { _gslStates } from './shortcuts/scopes/gslStates.impl';

// ─── Public types ───

export type { DxRuntimeParams } from './core/dxUtilityTypes';
export type { DxDefinitions, DxDefinitionItem, FormEvents, DxDisplayRenderFn, DxResult } from './formDef.domain';
export type {
  TextDataInputDecorator,
  NumberDataInputDecorator,
  BooleanDataInputDecorator,
  InputDecorator,
  ValidShortcutType,
  InputTags,
  SimpleFieldDef,
  GslInputsConfig,
} from './shortcuts/inputs/inputs.domain';
export type { CalendarDecorator, GslCalendarConfig } from './shortcuts/calendar/calendar.domain';
export type { TextareaDecorator, GslTextareaConfig } from './shortcuts/textarea/textarea.domain';
export type { PasswordDecorator, GslPasswordConfig } from './shortcuts/password/password.domain';
export type { CheckboxDecorator, GslCheckboxConfig } from './shortcuts/checkbox/checkbox.domain';
export type { DateInputDecorator, GslDateInputConfig } from './shortcuts/date-input/dateInput.domain';
export type { CurrencyDecorator, GslCurrencyConfig } from './shortcuts/currency/currency.domain';
export type {
  RangeCalendarDecorator,
  GslRangeCalendarConfig,
} from './shortcuts/range-calendar/rangeCalendar.domain';
export type { SelectDecorator, GslSelectConfig } from './shortcuts/select/select.domain';
export type {
  RadiogroupDecorator,
  GslRadiogroupConfig,
} from './shortcuts/radiogroup/radiogroup.domain';
export type { TabsDecorator, GslTabsConfig } from './shortcuts/tabs/tabs.domain';
export type { ListDecorator, GslListConfig } from './shortcuts/list/list.domain';
export type { ActionDecorator, GslActionsConfig } from './shortcuts/actions/actions.domain';
export type { LayoutDecorator, GslLayoutsConfig } from './shortcuts/layouts/layouts.domain';
export type { DisplayDecorator, GslDisplaysConfig } from './shortcuts/display/display.domain';
export type { AlertDecorator, GslAlertsConfig } from './shortcuts/alert/alert.domain';
export type { DatePickerDecorator, GslDatePickerConfig } from './shortcuts/date-picker/datePicker.domain';
export type { DropdownDecorator, GslDropdownConfig } from './shortcuts/dropdown/dropdown.domain';
export type { AccordionDecorator, GslAccordionConfig } from './shortcuts/accordion/accordion.domain';
export type { RepeaterDecorator, GslRepeaterConfig } from './shortcuts/repeater/repeater.domain';
export type { MarkdownDecorator, GslMarkdownConfig } from './shortcuts/markdown/markdown.domain';
export type { RangeDateInputDecorator, GslRangeDateInputConfig } from './shortcuts/range-date-input/rangeDateInput.domain';
export type { RangeDatePickerDecorator, GslRangeDatePickerConfig } from './shortcuts/range-date-picker/rangeDatePicker.domain';
export type { CustomDisplayDecorator, GslCustomDisplayConfig } from './shortcuts/custom-display/customDisplay.domain';
export type { CustomInputDecorator, GslCustomInputConfig } from './shortcuts/custom-input/customInput.domain';
export type { CustomActionDecorator, GslCustomActionConfig } from './shortcuts/custom-action/customAction.domain';
export type { CustomLayoutDecorator, GslCustomLayoutConfig } from './shortcuts/custom-layout/customLayout.domain';
export type { GslSelectorsInput, FormConfig, DxFormConfig } from './core/dx.domain';
export { formDefs } from './dx.service';

// ─── Extension API (for adding custom shortcut types) ───

export { defineShortcutType } from './core/defineShortcutType';
export type { ShortcutTypeSelectors } from './core/defineShortcutType';
export { createGslSelector } from './core/dxUtilityTypes';
export type { GslConfigBase, GslDecoratorCallback, DefOrCallback, GuiShortcutOf } from './core/dxUtilityTypes';
export { processAutoLabel, processAutoPlaceholder } from './core/sharedSensibleDefaults.service';
export { extractWidgetProps } from './core/dxPropsHelper';
export type { DxCommonFields, DxInputBase, DxActionBase, DxLayoutBase, DxDisplayBase, DxInternalFields, DxFormEvent } from './core/dxBase.types';
