// ===================================================
// FormForge DX - Public API
// ===================================================

// --- Public namespace ---

export { gui } from './gui';

// --- GUI factories (structure) ---

export { _guiAccordion } from './shortcuts/accordion/guiAccordion.impl';
export { _guiButton } from './shortcuts/actions/guiActions.impl';
export { _guiAlert } from './shortcuts/alert/guiAlert.impl';
export { _guiCalendar } from './shortcuts/calendar/guiCalendar.impl';
export { _guiDateTimeCalendar } from './shortcuts/date-time-calendar/guiDateTimeCalendar.impl';
export { _guiDateTimePicker } from './shortcuts/date-time-picker/guiDateTimePicker.impl';
export { _guiCheckbox } from './shortcuts/checkbox/guiCheckbox.impl';
export { _guiCurrency } from './shortcuts/currency/guiCurrency.impl';
export { _guiCustomAction } from './shortcuts/custom-action/guiCustomAction.impl';
export { _guiCustomDisplay } from './shortcuts/custom-display/guiCustomDisplay.impl';
export { _guiCustomInput } from './shortcuts/custom-input/guiCustomInput.impl';
export { _guiCustomLayout } from './shortcuts/custom-layout/guiCustomLayout.impl';
export { _guiDateInput } from './shortcuts/date-input/guiDateInput.impl';
export { _guiDatePicker } from './shortcuts/date-picker/guiDatePicker.impl';
export { _guiDateTimeInput } from './shortcuts/date-time-input/guiDateTimeInput.impl';
export { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
export { _guiDropdown } from './shortcuts/dropdown/guiDropdown.impl';
export { _guiBooleanInput } from './shortcuts/inputs/guiBooleanInput.impl';
export { _guiNumberInput } from './shortcuts/inputs/guiNumberInput.impl';
export { _guiTextInput } from './shortcuts/inputs/guiTextInput.impl';
export {
  _guiFlex,
  _guiGrid,
  _guiHorizontalFlex,
  _guiHorizontalGrid,
  _guiVerticalFlex,
  _guiVerticalGrid,
} from './shortcuts/layouts/guiFlex.impl';
export { _guiList } from './shortcuts/list/guiList.impl';
export { _guiMarkdown } from './shortcuts/markdown/guiMarkdown.impl';
export { _guiMarkdownText } from './shortcuts/markdown-text/guiMarkdownText.impl';
export { _guiPassword } from './shortcuts/password/guiPassword.impl';
export { _guiRadiogroup } from './shortcuts/radiogroup/guiRadiogroup.impl';
export { _guiRangeCalendar } from './shortcuts/range-calendar/guiRangeCalendar.impl';
export { _guiRangeDateInput } from './shortcuts/range-date-input/guiRangeDateInput.impl';
export { _guiRangeDateTimeInput } from './shortcuts/range-date-time-input/guiRangeDateTimeInput.impl';
export { _guiRangeDateTimeCalendar } from './shortcuts/range-date-time-calendar/guiRangeDateTimeCalendar.impl';
export { _guiRangeDateTimePicker } from './shortcuts/range-date-time-picker/guiRangeDateTimePicker.impl';
export { _guiRangeTimeInput } from './shortcuts/range-time-input/guiRangeTimeInput.impl';
export { _guiRangeDatePicker } from './shortcuts/range-date-picker/guiRangeDatePicker.impl';
export { _guiRangeTimePicker } from './shortcuts/range-time-picker/guiRangeTimePicker.impl';
export { _guiRepeater } from './shortcuts/repeater/guiRepeater.impl';
export { _guiSelect } from './shortcuts/select/guiSelect.impl';
export { _guiTabs } from './shortcuts/tabs/guiTabs.impl';
export { _guiTags } from './shortcuts/tags/guiTags.impl';
export { _guiTextarea } from './shortcuts/textarea/guiTextarea.impl';
export { _guiTimeInput } from './shortcuts/time-input/guiTimeInput.impl';
export { _guiTimePicker } from './shortcuts/time-picker/guiTimePicker.impl';

// --- GSL selectors (behavior) ---

export { _gslAccordionByUid, _gslAccordions } from './shortcuts/accordion/register';
export { _gslActionByUid, _gslActions } from './shortcuts/actions/register';
export { _gslAlertByUid, _gslAlerts } from './shortcuts/alert/register';
export { _gslCalendarByUid, _gslCalendars } from './shortcuts/calendar/register';
export {
  _gslDateTimeCalendarByUid,
  _gslDateTimeCalendars,
} from './shortcuts/date-time-calendar/register';
export { _gslCheckboxByUid, _gslCheckboxes } from './shortcuts/checkbox/register';
export { _gslCurrencies, _gslCurrencyByUid } from './shortcuts/currency/register';
export { _gslCustomActionByUid, _gslCustomActions } from './shortcuts/custom-action/register';
export { _gslCustomDisplayByUid, _gslCustomDisplays } from './shortcuts/custom-display/register';
export { _gslCustomInputByUid, _gslCustomInputs } from './shortcuts/custom-input/register';
export { _gslCustomLayoutByUid, _gslCustomLayouts } from './shortcuts/custom-layout/register';
export { _gslDateInputByUid, _gslDateInputs } from './shortcuts/date-input/register';
export { _gslDatePickerByUid, _gslDatePickers } from './shortcuts/date-picker/register';
export {
  _gslDateTimePickerByUid,
  _gslDateTimePickers,
} from './shortcuts/date-time-picker/register';
export { _gslDateTimeInputByUid, _gslDateTimeInputs } from './shortcuts/date-time-input/register';
export { _gslDisplayByUid, _gslDisplays } from './shortcuts/display/register';
export { _gslDropdownByUid, _gslDropdowns } from './shortcuts/dropdown/register';
export {
  _gslBooleanInputs,
  _gslNumberInputs,
  _gslTextInputs,
} from './shortcuts/inputs/gslInputSubtypes';
export { _gslInputByUid, _gslInputs } from './shortcuts/inputs/register';
export { _gslLayoutByUid, _gslLayouts } from './shortcuts/layouts/register';
export { _gslListByUid, _gslLists } from './shortcuts/list/register';
export { _gslMarkdownByUid, _gslMarkdowns } from './shortcuts/markdown/register';
export { _gslMarkdownTextByUid, _gslMarkdownTexts } from './shortcuts/markdown-text/register';
export { _gslPasswordByUid, _gslPasswords } from './shortcuts/password/register';
export { _gslRadiogroupByUid, _gslRadiogroups } from './shortcuts/radiogroup/register';
export { _gslRangeCalendarByUid, _gslRangeCalendars } from './shortcuts/range-calendar/register';
export {
  _gslRangeDateInputByUid,
  _gslRangeDateInputs,
} from './shortcuts/range-date-input/register';
export {
  _gslRangeDateTimeInputByUid,
  _gslRangeDateTimeInputs,
} from './shortcuts/range-date-time-input/register';
export {
  _gslRangeDateTimeCalendarByUid,
  _gslRangeDateTimeCalendars,
} from './shortcuts/range-date-time-calendar/register';
export {
  _gslRangeDateTimePickerByUid,
  _gslRangeDateTimePickers,
} from './shortcuts/range-date-time-picker/register';
export {
  _gslRangeTimeInputByUid,
  _gslRangeTimeInputs,
} from './shortcuts/range-time-input/register';
export {
  _gslRangeDatePickerByUid,
  _gslRangeDatePickers,
} from './shortcuts/range-date-picker/register';
export {
  _gslRangeTimePickerByUid,
  _gslRangeTimePickers,
} from './shortcuts/range-time-picker/register';
export { _gslRepeaterByUid, _gslRepeaters } from './shortcuts/repeater/register';
export { _gslSelectByUid, _gslSelects } from './shortcuts/select/register';
export { _gslTabs, _gslTabsByUid } from './shortcuts/tabs/register';
export { _gslTags, _gslTagsByUid } from './shortcuts/tags/register';
export { _gslTextareaByUid, _gslTextareas } from './shortcuts/textarea/register';
export { _gslTimeInputByUid, _gslTimeInputs } from './shortcuts/time-input/register';
export { _gslTimePickerByUid, _gslTimePickers } from './shortcuts/time-picker/register';

// --- Scope selectors ---
//
// `_gslTag` and `_gslStates` are kept as internal underscore-era primitives
// pending focus-closeout removal. They are not part of the spec entrance
// (`gui.selectors.tag(...)` / `.state(...)` are). `_gslRoot` retired in
// Phase 15 - the chain emits combined-matcher leaves directly, no wrap step.

export { _gslStates } from './shortcuts/scopes/gslStates.impl';
export { _gslTag } from './shortcuts/scopes/gslTag.impl';

// --- Public types ---

export type { GslSelectorsInput } from '@golemui/dx';
export type { DxFormConfig, FormConfig } from './guiDependencyTypes';
export type { DxRuntimeParams } from '@golemui/dx';
export type { DxValidator } from '@golemui/dx';
export { formDefs } from './formDefs';
export type {
  DxDefinitionItem,
  DxDefinitions,
  DxDisplayRenderFn,
  DxResult,
  FormEvents,
} from './formDef.domain';
export { isDxDefinitions, resolveFormInput } from './resolveFormInput';
export type { FormInput, GuiFormInitConfig, ResolvedFormInput } from './resolveFormInput';
export type {
  AccordionDecorator,
  GslAccordionConfig,
} from './shortcuts/accordion/accordion.domain';
export type { ActionDecorator, GslActionsConfig } from './shortcuts/actions/actions.domain';
export type { AlertDecorator, GslAlertsConfig } from './shortcuts/alert/alert.domain';
export type { CalendarDecorator, GslCalendarConfig } from './shortcuts/calendar/calendar.domain';
export type {
  DateTimeCalendarDecorator,
  GslDateTimeCalendarConfig,
} from './shortcuts/date-time-calendar/dateTimeCalendar.domain';
export type { CheckboxDecorator, GslCheckboxConfig } from './shortcuts/checkbox/checkbox.domain';
export type { CurrencyDecorator, GslCurrencyConfig } from './shortcuts/currency/currency.domain';
export type {
  CustomActionDecorator,
  GslCustomActionConfig,
} from './shortcuts/custom-action/customAction.domain';
export type {
  CustomDisplayDecorator,
  GslCustomDisplayConfig,
} from './shortcuts/custom-display/customDisplay.domain';
export type {
  CustomInputDecorator,
  GslCustomInputConfig,
} from './shortcuts/custom-input/customInput.domain';
export type {
  CustomLayoutDecorator,
  GslCustomLayoutConfig,
} from './shortcuts/custom-layout/customLayout.domain';
export type {
  DateInputDecorator,
  GslDateInputConfig,
} from './shortcuts/date-input/dateInput.domain';
export type {
  DatePickerDecorator,
  GslDatePickerConfig,
} from './shortcuts/date-picker/datePicker.domain';
export type {
  DateTimePickerDecorator,
  GslDateTimePickerConfig,
} from './shortcuts/date-time-picker/dateTimePicker.domain';
export type {
  DateTimeInputDecorator,
  GslDateTimeInputConfig,
} from './shortcuts/date-time-input/dateTimeInput.domain';
export type { DisplayDecorator, GslDisplaysConfig } from './shortcuts/display/display.domain';
export type { DropdownDecorator, GslDropdownConfig } from './shortcuts/dropdown/dropdown.domain';
export type {
  BooleanDataInputDecorator,
  GslInputsConfig,
  InputDecorator,
  InputTags,
  NumberDataInputDecorator,
  SimpleFieldDef,
  TextDataInputDecorator,
  ValidShortcutType,
} from './shortcuts/inputs/inputs.domain';
export type { GslLayoutsConfig, LayoutDecorator } from './shortcuts/layouts/layouts.domain';
export type { GslListConfig, ListDecorator } from './shortcuts/list/list.domain';
export type { GslMarkdownConfig, MarkdownDecorator } from './shortcuts/markdown/markdown.domain';
export type { GslPasswordConfig, PasswordDecorator } from './shortcuts/password/password.domain';
export type {
  GslRadiogroupConfig,
  RadiogroupDecorator,
} from './shortcuts/radiogroup/radiogroup.domain';
export type {
  GslRangeCalendarConfig,
  RangeCalendarDecorator,
} from './shortcuts/range-calendar/rangeCalendar.domain';
export type {
  GslRangeDateInputConfig,
  RangeDateInputDecorator,
} from './shortcuts/range-date-input/rangeDateInput.domain';
export type {
  GslRangeDateTimeInputConfig,
  RangeDateTimeInputDecorator,
} from './shortcuts/range-date-time-input/rangeDateTimeInput.domain';
export type {
  GslRangeDateTimeCalendarConfig,
  RangeDateTimeCalendarDecorator,
} from './shortcuts/range-date-time-calendar/rangeDateTimeCalendar.domain';
export type {
  GslRangeDateTimePickerConfig,
  RangeDateTimePickerDecorator,
} from './shortcuts/range-date-time-picker/rangeDateTimePicker.domain';
export type {
  GslRangeTimeInputConfig,
  RangeTimeInputDecorator,
} from './shortcuts/range-time-input/rangeTimeInput.domain';
export type {
  GslRangeDatePickerConfig,
  RangeDatePickerDecorator,
} from './shortcuts/range-date-picker/rangeDatePicker.domain';
export type {
  GslRangeTimePickerConfig,
  RangeTimePickerDecorator,
} from './shortcuts/range-time-picker/rangeTimePicker.domain';
export type { GslRepeaterConfig, RepeaterDecorator } from './shortcuts/repeater/repeater.domain';
export type { GslSelectConfig, SelectDecorator } from './shortcuts/select/select.domain';
export type { GslTabsConfig, TabsDecorator } from './shortcuts/tabs/tabs.domain';
export type { GslTagsConfig, TagsDecorator } from './shortcuts/tags/tags.domain';
export type { GslTextareaConfig, TextareaDecorator } from './shortcuts/textarea/textarea.domain';
export type {
  GslTimeInputConfig,
  TimeInputDecorator,
} from './shortcuts/time-input/timeInput.domain';
export type {
  GslTimePickerConfig,
  TimePickerDecorator,
} from './shortcuts/time-picker/timePicker.domain';

// --- Extension API (for adding custom shortcut types) ---

export { defineShortcutType, guiRegistry } from './registry';
export type { ShortcutTypeSelectors } from '@golemui/dx';
export type {
  DxActionBase,
  DxCommonFields,
  DxDisplayBase,
  DxFormEvent,
  DxInputBase,
  DxInternalFields,
  DxLayoutBase,
} from '@golemui/dx';
export { extractWidgetProps } from '@golemui/dx';
export { createGslSelector } from '@golemui/dx';
export type {
  DefOrCallback,
  GslConfigBase,
  GslDecoratorCallback,
  GuiShortcutOf,
} from '@golemui/dx';
export { processAutoLabel, processAutoPlaceholder } from '@golemui/dx';
