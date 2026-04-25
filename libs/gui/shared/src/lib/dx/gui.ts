// ═══════════════════════════════════════════════════
// gui — Public namespace façade
//
// Aggregates DX factory and selector exports under spec-correct names.
// Type selectors and ByUid variants. Scope operators (tag, state) are
// wrapping functions — chaining engine lands in Phase 15.
// ═══════════════════════════════════════════════════

// ─── Inputs ───
import { _guiTextInput } from './shortcuts/inputs/guiTextInput.impl';
import { _guiNumberInput } from './shortcuts/inputs/guiNumberInput.impl';
import { _guiBooleanInput } from './shortcuts/inputs/guiBooleanInput.impl';
import { _guiSelect } from './shortcuts/select/guiSelect.impl';
import { _guiDropdown } from './shortcuts/dropdown/guiDropdown.impl';
import { _guiRadiogroup } from './shortcuts/radiogroup/guiRadiogroup.impl';
import { _guiCheckbox } from './shortcuts/checkbox/guiCheckbox.impl';
import { _guiTextarea } from './shortcuts/textarea/guiTextarea.impl';
import { _guiPassword } from './shortcuts/password/guiPassword.impl';
import { _guiCurrency } from './shortcuts/currency/guiCurrency.impl';
import { _guiMarkdown } from './shortcuts/markdown/guiMarkdown.impl';
import { _guiList } from './shortcuts/list/guiList.impl';
import { _guiCalendar } from './shortcuts/calendar/guiCalendar.impl';
import { _guiDateInput } from './shortcuts/date-input/guiDateInput.impl';
import { _guiDatePicker } from './shortcuts/date-picker/guiDatePicker.impl';
import { _guiRangeCalendar } from './shortcuts/range-calendar/guiRangeCalendar.impl';
import { _guiRangeDateInput } from './shortcuts/range-date-input/guiRangeDateInput.impl';
import { _guiRangeDatePicker } from './shortcuts/range-date-picker/guiRangeDatePicker.impl';
import { _guiCustomInput } from './shortcuts/custom-input/guiCustomInput.impl';

// ─── Actions ───
import { _guiButton, _guiSubmitButton } from './shortcuts/actions/guiActions.impl';
import { _guiCustomAction } from './shortcuts/custom-action/guiCustomAction.impl';

// ─── Displays ───
import { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
import { _guiAlert } from './shortcuts/alert/guiAlert.impl';
import { _guiCustomDisplay } from './shortcuts/custom-display/guiCustomDisplay.impl';

// ─── Layouts ───
import {
  _guiFlex,
  _guiHorizontalFlex,
  _guiVerticalFlex,
  _guiGrid,
  _guiHorizontalGrid,
  _guiVerticalGrid,
} from './shortcuts/layouts/guiFlex.impl';
import { _guiTabs } from './shortcuts/tabs/guiTabs.impl';
import { _guiAccordion } from './shortcuts/accordion/guiAccordion.impl';
import { _guiCustomLayout } from './shortcuts/custom-layout/guiCustomLayout.impl';

// ─── Repeater ───
import { _guiRepeater } from './shortcuts/repeater/guiRepeater.impl';

// ─── Selectors — type selectors ───
import { _gslInputs, _gslInputByUid } from './shortcuts/inputs/register';
import { _gslTextInputs, _gslNumberInputs, _gslBooleanInputs } from './shortcuts/inputs/gslInputSubtypes';
import { _gslSelects, _gslSelectByUid } from './shortcuts/select/register';
import { _gslDropdowns, _gslDropdownByUid } from './shortcuts/dropdown/register';
import { _gslRadiogroups, _gslRadiogroupByUid } from './shortcuts/radiogroup/register';
import { _gslCheckboxes, _gslCheckboxByUid } from './shortcuts/checkbox/register';
import { _gslTextareas, _gslTextareaByUid } from './shortcuts/textarea/register';
import { _gslPasswords, _gslPasswordByUid } from './shortcuts/password/register';
import { _gslCurrencies, _gslCurrencyByUid } from './shortcuts/currency/register';
import { _gslMarkdowns, _gslMarkdownByUid } from './shortcuts/markdown/register';
import { _gslLists, _gslListByUid } from './shortcuts/list/register';
import { _gslCalendars, _gslCalendarByUid } from './shortcuts/calendar/register';
import { _gslDateInputs, _gslDateInputByUid } from './shortcuts/date-input/register';
import { _gslDatePickers, _gslDatePickerByUid } from './shortcuts/date-picker/register';
import { _gslRangeCalendars, _gslRangeCalendarByUid } from './shortcuts/range-calendar/register';
import { _gslRangeDateInputs, _gslRangeDateInputByUid } from './shortcuts/range-date-input/register';
import { _gslRangeDatePickers, _gslRangeDatePickerByUid } from './shortcuts/range-date-picker/register';
import { _gslRepeaters, _gslRepeaterByUid } from './shortcuts/repeater/register';
import { _gslActions, _gslActionByUid } from './shortcuts/actions/register';
import { _gslLayouts, _gslLayoutByUid } from './shortcuts/layouts/register';
import { _gslDisplays, _gslDisplayByUid } from './shortcuts/display/register';
import { _gslAlerts, _gslAlertByUid } from './shortcuts/alert/register';
import { _gslTabs, _gslTabsByUid } from './shortcuts/tabs/register';
import { _gslAccordions, _gslAccordionByUid } from './shortcuts/accordion/register';
import { _gslCustomInputs, _gslCustomInputByUid } from './shortcuts/custom-input/register';
import { _gslCustomActions, _gslCustomActionByUid } from './shortcuts/custom-action/register';
import { _gslCustomDisplays, _gslCustomDisplayByUid } from './shortcuts/custom-display/register';
import { _gslCustomLayouts, _gslCustomLayoutByUid } from './shortcuts/custom-layout/register';

// Scope operators (`_gslTag`, `_gslStates`, `_gslRoot`) are not part of the
// Phase 1 façade. They remain as deprecated `_gsl*` exports in `lib/dx/index.ts`,
// used by the 3 demos that compose scope-bearing selectors until Phase 15
// (selector chaining engine) replaces them with chain-method entrypoints on
// this same `gui.selectors` root instance.

export const gui = {
  inputs: {
    textInput: _guiTextInput,
    numberInput: _guiNumberInput,
    booleanInput: _guiBooleanInput,
    select: _guiSelect,
    dropdown: _guiDropdown,
    radiogroup: _guiRadiogroup,
    checkbox: _guiCheckbox,
    textarea: _guiTextarea,
    password: _guiPassword,
    currency: _guiCurrency,
    markdown: _guiMarkdown,
    list: _guiList,
    calendar: _guiCalendar,
    dateInput: _guiDateInput,
    datePicker: _guiDatePicker,
    rangeCalendar: _guiRangeCalendar,
    rangeDateInput: _guiRangeDateInput,
    rangeDatePicker: _guiRangeDatePicker,
    repeater: _guiRepeater,
    custom: _guiCustomInput,
  },
  actions: {
    button: _guiButton,
    submitButton: _guiSubmitButton,
    custom: _guiCustomAction,
  },
  displays: {
    display: _guiDisplay,
    alert: _guiAlert,
    custom: _guiCustomDisplay,
  },
  layouts: {
    flex: _guiFlex,
    horizontalFlex: _guiHorizontalFlex,
    verticalFlex: _guiVerticalFlex,
    grid: _guiGrid,
    horizontalGrid: _guiHorizontalGrid,
    verticalGrid: _guiVerticalGrid,
    tabs: _guiTabs,
    accordion: _guiAccordion,
    custom: _guiCustomLayout,
  },
  selectors: {
    inputs: _gslInputs,
    inputByUid: _gslInputByUid,
    textInputs: _gslTextInputs,
    numberInputs: _gslNumberInputs,
    booleanInputs: _gslBooleanInputs,
    selects: _gslSelects,
    selectByUid: _gslSelectByUid,
    dropdowns: _gslDropdowns,
    dropdownByUid: _gslDropdownByUid,
    radiogroups: _gslRadiogroups,
    radiogroupByUid: _gslRadiogroupByUid,
    checkboxes: _gslCheckboxes,
    checkboxByUid: _gslCheckboxByUid,
    textareas: _gslTextareas,
    textareaByUid: _gslTextareaByUid,
    passwords: _gslPasswords,
    passwordByUid: _gslPasswordByUid,
    currencies: _gslCurrencies,
    currencyByUid: _gslCurrencyByUid,
    markdowns: _gslMarkdowns,
    markdownByUid: _gslMarkdownByUid,
    lists: _gslLists,
    listByUid: _gslListByUid,
    calendars: _gslCalendars,
    calendarByUid: _gslCalendarByUid,
    dateInputs: _gslDateInputs,
    dateInputByUid: _gslDateInputByUid,
    datePickers: _gslDatePickers,
    datePickerByUid: _gslDatePickerByUid,
    rangeCalendars: _gslRangeCalendars,
    rangeCalendarByUid: _gslRangeCalendarByUid,
    rangeDateInputs: _gslRangeDateInputs,
    rangeDateInputByUid: _gslRangeDateInputByUid,
    rangeDatePickers: _gslRangeDatePickers,
    rangeDatePickerByUid: _gslRangeDatePickerByUid,
    repeaters: _gslRepeaters,
    repeaterByUid: _gslRepeaterByUid,
    actions: _gslActions,
    actionByUid: _gslActionByUid,
    layouts: _gslLayouts,
    layoutByUid: _gslLayoutByUid,
    displays: _gslDisplays,
    displayByUid: _gslDisplayByUid,
    alerts: _gslAlerts,
    alertByUid: _gslAlertByUid,
    tabs: _gslTabs,
    tabsByUid: _gslTabsByUid,
    accordions: _gslAccordions,
    accordionByUid: _gslAccordionByUid,
    customInputs: _gslCustomInputs,
    customInputByUid: _gslCustomInputByUid,
    customActions: _gslCustomActions,
    customActionByUid: _gslCustomActionByUid,
    customDisplays: _gslCustomDisplays,
    customDisplayByUid: _gslCustomDisplayByUid,
    customLayouts: _gslCustomLayouts,
    customLayoutByUid: _gslCustomLayoutByUid,
  },
} as const;
