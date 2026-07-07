// ═══════════════════════════════════════════════════
// gui — Public namespace façade
//
// Aggregates DX factory and selector exports under spec-correct names.
// `gui.selectors` is a `ScopeChain` root instance: type-selector methods
// (`inputs`, `inputByUid`, …) emit `GslLeafSelector`s, scope methods
// (`tag`, `state`, `tagsAnd`, `tagsOr`) extend the chain immutably.
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
import { _guiDateTimeCalendar } from './shortcuts/date-time-calendar/guiDateTimeCalendar.impl';
import { _guiDateInput } from './shortcuts/date-input/guiDateInput.impl';
import { _guiDatePicker } from './shortcuts/date-picker/guiDatePicker.impl';
import { _guiRangeCalendar } from './shortcuts/range-calendar/guiRangeCalendar.impl';
import { _guiRangeDateInput } from './shortcuts/range-date-input/guiRangeDateInput.impl';
import { _guiRangeDatePicker } from './shortcuts/range-date-picker/guiRangeDatePicker.impl';
import { _guiTimeInput } from './shortcuts/time-input/guiTimeInput.impl';
import { _guiTimePicker } from './shortcuts/time-picker/guiTimePicker.impl';
import { _guiDateTimeInput } from './shortcuts/date-time-input/guiDateTimeInput.impl';
import { _guiCustomInput } from './shortcuts/custom-input/guiCustomInput.impl';

// ─── Actions ───
import { _guiButton } from './shortcuts/actions/guiActions.impl';
import { _guiCustomAction } from './shortcuts/custom-action/guiCustomAction.impl';

// ─── Displays ───
import { _guiDisplay } from './shortcuts/display/guiDisplay.impl';
import { _guiAlert } from './shortcuts/alert/guiAlert.impl';
import { _guiMarkdownText } from './shortcuts/markdown-text/guiMarkdownText.impl';
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

// ─── Tags ───
import { _guiTags } from './shortcuts/tags/guiTags.impl';

// ─── Selectors — chain root ───
import { ScopeChain } from './shortcuts/scopes/scopeChain';

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
    dateTimeCalendar: _guiDateTimeCalendar,
    dateInput: _guiDateInput,
    datePicker: _guiDatePicker,
    timeInput: _guiTimeInput,
    timePicker: _guiTimePicker,
    dateTimeInput: _guiDateTimeInput,
    rangeCalendar: _guiRangeCalendar,
    rangeDateInput: _guiRangeDateInput,
    rangeDatePicker: _guiRangeDatePicker,
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
  selectors: ScopeChain.root(),
} as const;
