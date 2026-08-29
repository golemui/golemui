// ===================================================
// gui - the gui widget set implementation
//
// One `createImplementation` call assembles the public namespace from the
// shortcut factory facade, the generated selector chain, and the gui
// adapter. `gui.selectors` is the chain root: type-selector methods
// (`inputs`, `inputByUid`, ...) emit `GslLeafSelector`s, scope methods
// (`tag`, `state`, `tagsAnd`, `tagsOr`) extend the chain immutably.
// ===================================================

import {
  createImplementation,
  createSelectors,
  GuiItemTypes,
  type DxAdapter,
  type ValidShortcut,
} from '@golemui/dx';

import { guiRegistry } from './registry';
import type { Dependencies } from '../shared';

// --- Inputs ---
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
import { _guiMultiDropdown } from './shortcuts/multi-dropdown/guiMultiDropdown.impl';
import { _guiMultiList } from './shortcuts/multi-list/guiMultiList.impl';
import { _guiFileUpload } from './shortcuts/file-upload/guiFileUpload.impl';
import { _guiMultiFileUpload } from './shortcuts/multi-file-upload/guiMultiFileUpload.impl';
import { _guiCalendar } from './shortcuts/calendar/guiCalendar.impl';
import { _guiDateTimeCalendar } from './shortcuts/date-time-calendar/guiDateTimeCalendar.impl';
import { _guiDateInput } from './shortcuts/date-input/guiDateInput.impl';
import { _guiDatePicker } from './shortcuts/date-picker/guiDatePicker.impl';
import { _guiDateTimePicker } from './shortcuts/date-time-picker/guiDateTimePicker.impl';
import { _guiRangeCalendar } from './shortcuts/range-calendar/guiRangeCalendar.impl';
import { _guiRangeDateInput } from './shortcuts/range-date-input/guiRangeDateInput.impl';
import { _guiRangeDateTimeInput } from './shortcuts/range-date-time-input/guiRangeDateTimeInput.impl';
import { _guiRangeDateTimeCalendar } from './shortcuts/range-date-time-calendar/guiRangeDateTimeCalendar.impl';
import { _guiRangeDateTimePicker } from './shortcuts/range-date-time-picker/guiRangeDateTimePicker.impl';
import { _guiRangeTimeInput } from './shortcuts/range-time-input/guiRangeTimeInput.impl';
import { _guiRangeDatePicker } from './shortcuts/range-date-picker/guiRangeDatePicker.impl';
import { _guiRangeTimePicker } from './shortcuts/range-time-picker/guiRangeTimePicker.impl';
import { _guiTimeInput } from './shortcuts/time-input/guiTimeInput.impl';
import { _guiTimePicker } from './shortcuts/time-picker/guiTimePicker.impl';
import { _guiDateTimeInput } from './shortcuts/date-time-input/guiDateTimeInput.impl';
import { _guiCustomInput } from './shortcuts/custom-input/guiCustomInput.impl';

// --- Actions ---
import { _guiButton } from './shortcuts/actions/guiActions.impl';
import { _guiCustomAction } from './shortcuts/custom-action/guiCustomAction.impl';

// --- Displays ---
import { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
import { _guiAlert } from './shortcuts/alert/guiAlert.impl';
import { _guiMarkdownText } from './shortcuts/markdown-text/guiMarkdownText.impl';
import { _guiCustomDisplay } from './shortcuts/custom-display/guiCustomDisplay.impl';

// --- Layouts ---
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
import { type LayoutEntry } from './shortcuts/layouts/layouts.domain';

// --- Repeater ---
import { _guiRepeater } from './shortcuts/repeater/guiRepeater.impl';

// --- Tags ---
import { _guiTags } from './shortcuts/tags/guiTags.impl';

// --- GSL selector factories (one pair per widget type) ---
import { _gslInputs, _gslInputByUid } from './shortcuts/inputs/register';
import {
  _gslTextInputs,
  _gslNumberInputs,
  _gslBooleanInputs,
} from './shortcuts/inputs/gslInputSubtypes';
import { _gslSelects, _gslSelectByUid } from './shortcuts/select/register';
import { _gslDropdowns, _gslDropdownByUid } from './shortcuts/dropdown/register';
import { _gslRadiogroups, _gslRadiogroupByUid } from './shortcuts/radiogroup/register';
import { _gslCheckboxes, _gslCheckboxByUid } from './shortcuts/checkbox/register';
import { _gslTextareas, _gslTextareaByUid } from './shortcuts/textarea/register';
import { _gslPasswords, _gslPasswordByUid } from './shortcuts/password/register';
import { _gslCurrencies, _gslCurrencyByUid } from './shortcuts/currency/register';
import { _gslMarkdowns, _gslMarkdownByUid } from './shortcuts/markdown/register';
import { _gslLists, _gslListByUid } from './shortcuts/list/register';
import { _gslMultiDropdowns, _gslMultiDropdownByUid } from './shortcuts/multi-dropdown/register';
import { _gslMultiLists, _gslMultiListByUid } from './shortcuts/multi-list/register';
import { _gslFileUploads, _gslFileUploadByUid } from './shortcuts/file-upload/register';
import {
  _gslMultiFileUploads,
  _gslMultiFileUploadByUid,
} from './shortcuts/multi-file-upload/register';
import { _gslCalendars, _gslCalendarByUid } from './shortcuts/calendar/register';
import {
  _gslDateTimeCalendars,
  _gslDateTimeCalendarByUid,
} from './shortcuts/date-time-calendar/register';
import { _gslDateInputs, _gslDateInputByUid } from './shortcuts/date-input/register';
import { _gslDatePickers, _gslDatePickerByUid } from './shortcuts/date-picker/register';
import {
  _gslDateTimePickers,
  _gslDateTimePickerByUid,
} from './shortcuts/date-time-picker/register';
import { _gslRangeCalendars, _gslRangeCalendarByUid } from './shortcuts/range-calendar/register';
import {
  _gslRangeDateInputs,
  _gslRangeDateInputByUid,
} from './shortcuts/range-date-input/register';
import {
  _gslRangeDateTimeInputs,
  _gslRangeDateTimeInputByUid,
} from './shortcuts/range-date-time-input/register';
import {
  _gslRangeDateTimeCalendars,
  _gslRangeDateTimeCalendarByUid,
} from './shortcuts/range-date-time-calendar/register';
import {
  _gslRangeDateTimePickers,
  _gslRangeDateTimePickerByUid,
} from './shortcuts/range-date-time-picker/register';
import {
  _gslRangeTimeInputs,
  _gslRangeTimeInputByUid,
} from './shortcuts/range-time-input/register';
import { _gslTimeInputs, _gslTimeInputByUid } from './shortcuts/time-input/register';
import { _gslTimePickers, _gslTimePickerByUid } from './shortcuts/time-picker/register';
import { _gslDateTimeInputs, _gslDateTimeInputByUid } from './shortcuts/date-time-input/register';
import {
  _gslRangeDatePickers,
  _gslRangeDatePickerByUid,
} from './shortcuts/range-date-picker/register';
import {
  _gslRangeTimePickers,
  _gslRangeTimePickerByUid,
} from './shortcuts/range-time-picker/register';
import { _gslRepeaters, _gslRepeaterByUid } from './shortcuts/repeater/register';
import { _gslActions, _gslActionByUid } from './shortcuts/actions/register';
import { _gslLayouts, _gslLayoutByUid } from './shortcuts/layouts/register';
import { _gslDisplays, _gslDisplayByUid } from './shortcuts/display/register';
import { _gslAlerts, _gslAlertByUid } from './shortcuts/alert/register';
import { _gslMarkdownTexts, _gslMarkdownTextByUid } from './shortcuts/markdown-text/register';
import { _gslTabs, _gslTabsByUid } from './shortcuts/tabs/register';
import { _gslAccordions, _gslAccordionByUid } from './shortcuts/accordion/register';
import { _gslCustomInputs, _gslCustomInputByUid } from './shortcuts/custom-input/register';
import { _gslCustomActions, _gslCustomActionByUid } from './shortcuts/custom-action/register';
import { _gslCustomDisplays, _gslCustomDisplayByUid } from './shortcuts/custom-display/register';
import { _gslCustomLayouts, _gslCustomLayoutByUid } from './shortcuts/custom-layout/register';

/**
 * The gui selector chain root. One method per selector factory below; the
 * method names and argument types are pinned by the selector chain spec.
 */
const guiSelectors = createSelectors({
  // Inputs
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
  multiDropdowns: _gslMultiDropdowns,
  multiDropdownByUid: _gslMultiDropdownByUid,
  multiLists: _gslMultiLists,
  multiListByUid: _gslMultiListByUid,
  fileUploads: _gslFileUploads,
  fileUploadByUid: _gslFileUploadByUid,
  multiFileUploads: _gslMultiFileUploads,
  multiFileUploadByUid: _gslMultiFileUploadByUid,
  calendars: _gslCalendars,
  calendarByUid: _gslCalendarByUid,
  dateTimeCalendars: _gslDateTimeCalendars,
  dateTimeCalendarByUid: _gslDateTimeCalendarByUid,
  dateInputs: _gslDateInputs,
  dateInputByUid: _gslDateInputByUid,
  timeInputs: _gslTimeInputs,
  timeInputByUid: _gslTimeInputByUid,
  timePickers: _gslTimePickers,
  timePickerByUid: _gslTimePickerByUid,
  dateTimeInputs: _gslDateTimeInputs,
  dateTimeInputByUid: _gslDateTimeInputByUid,
  datePickers: _gslDatePickers,
  datePickerByUid: _gslDatePickerByUid,
  dateTimePickers: _gslDateTimePickers,
  dateTimePickerByUid: _gslDateTimePickerByUid,
  rangeCalendars: _gslRangeCalendars,
  rangeCalendarByUid: _gslRangeCalendarByUid,
  rangeDateInputs: _gslRangeDateInputs,
  rangeDateInputByUid: _gslRangeDateInputByUid,
  rangeTimeInputs: _gslRangeTimeInputs,
  rangeTimeInputByUid: _gslRangeTimeInputByUid,
  rangeDateTimeInputs: _gslRangeDateTimeInputs,
  rangeDateTimeInputByUid: _gslRangeDateTimeInputByUid,
  rangeDateTimeCalendars: _gslRangeDateTimeCalendars,
  rangeDateTimeCalendarByUid: _gslRangeDateTimeCalendarByUid,
  rangeDateTimePickers: _gslRangeDateTimePickers,
  rangeDateTimePickerByUid: _gslRangeDateTimePickerByUid,
  rangeDatePickers: _gslRangeDatePickers,
  rangeDatePickerByUid: _gslRangeDatePickerByUid,
  rangeTimePickers: _gslRangeTimePickers,
  rangeTimePickerByUid: _gslRangeTimePickerByUid,
  repeaters: _gslRepeaters,
  repeaterByUid: _gslRepeaterByUid,
  // Actions, displays, layouts
  actions: _gslActions,
  actionByUid: _gslActionByUid,
  layouts: _gslLayouts,
  layoutByUid: _gslLayoutByUid,
  displays: _gslDisplays,
  displayByUid: _gslDisplayByUid,
  alerts: _gslAlerts,
  alertByUid: _gslAlertByUid,
  markdownTexts: _gslMarkdownTexts,
  markdownTextByUid: _gslMarkdownTextByUid,
  tabs: _gslTabs,
  tabsByUid: _gslTabsByUid,
  accordions: _gslAccordions,
  accordionByUid: _gslAccordionByUid,
  // Custom kinds
  customInputs: _gslCustomInputs,
  customInputByUid: _gslCustomInputByUid,
  customActions: _gslCustomActions,
  customActionByUid: _gslCustomActionByUid,
  customDisplays: _gslCustomDisplays,
  customDisplayByUid: _gslCustomDisplayByUid,
  customLayouts: _gslCustomLayouts,
  customLayoutByUid: _gslCustomLayoutByUid,
});

// The gui choices for the generic DX pipeline: a bare function in a form
// definition becomes a gui display widget, and the auto-stack root is the
// reserved 'flex' layout rendered as a vertical column.
const guiAdapter: DxAdapter = {
  bareItemToWidget: (renderFn) => _guiDisplay(renderFn),
  rootEntry: (children: ValidShortcut[]) => {
    const rootEntry: LayoutEntry = {
      def: { uid: '#root', direction: 'column', widgetName: 'flex' },
      children,
    };
    return { type: 'ITEMS', itemType: GuiItemTypes.LAYOUTS, items: [rootEntry], tags: [] };
  },
};

// The shortcut factory groups of the public namespace. Named so the
// dependency shape can be passed to createImplementation explicitly: giving
// any type argument means giving all of them.
const guiFacade = {
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
    multiDropdown: _guiMultiDropdown,
    multiList: _guiMultiList,
    fileUpload: _guiFileUpload,
    multiFileUpload: _guiMultiFileUpload,
    calendar: _guiCalendar,
    dateTimeCalendar: _guiDateTimeCalendar,
    dateInput: _guiDateInput,
    datePicker: _guiDatePicker,
    dateTimePicker: _guiDateTimePicker,
    timeInput: _guiTimeInput,
    timePicker: _guiTimePicker,
    dateTimeInput: _guiDateTimeInput,
    rangeCalendar: _guiRangeCalendar,
    rangeDateInput: _guiRangeDateInput,
    rangeDateTimeInput: _guiRangeDateTimeInput,
    rangeDateTimeCalendar: _guiRangeDateTimeCalendar,
    rangeDateTimePicker: _guiRangeDateTimePicker,
    rangeTimeInput: _guiRangeTimeInput,
    rangeDatePicker: _guiRangeDatePicker,
    rangeTimePicker: _guiRangeTimePicker,
    repeater: _guiRepeater,
    tags: _guiTags,
    custom: _guiCustomInput,
  },
  actions: {
    button: _guiButton,
    custom: _guiCustomAction,
  },
  displays: {
    display: _guiDisplay,
    alert: _guiAlert,
    markdownText: _guiMarkdownText,
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
};

/**
 * The assembled gui widget set: the authoring namespace plus the DX
 * form-definition service and the framework bridge, all bound to the gui
 * registry and adapter. `Dependencies` is the gui widget set's dependency
 * shape, so form authors get its keys typed on `formConfig.dependencies` and
 * on the resolved form input.
 */
export const guiImplementation = createImplementation<
  typeof guiFacade,
  typeof guiSelectors,
  Dependencies
>({
  name: 'gui',
  registry: guiRegistry,
  facade: guiFacade,
  selectors: guiSelectors,
  adapter: guiAdapter,
});

/**
 * The public gui authoring namespace: the shortcut factory groups
 * (`gui.inputs.textInput(...)`, etc.) plus the selector chain root
 * (`gui.selectors.tag('billing').inputs({...})`).
 */
export const gui = guiImplementation.namespace;
