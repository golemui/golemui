import { createComponent, type EventName } from '@lit/react';
import React from 'react';
import { GuiButton } from '@golemui/gui-components/button';
import { GuiCalendar } from '@golemui/gui-components/calendar';
import { GuiDateTimeCalendar } from '@golemui/gui-components/date-time-calendar';
import { GuiCheckbox } from '@golemui/gui-components/checkbox';
import { GuiCurrency } from '@golemui/gui-components/currency';
import { GuiDate } from '@golemui/gui-components/date-input';
import { GuiDatePicker } from '@golemui/gui-components/date-picker';
import { GuiDateTime } from '@golemui/gui-components/date-time-input';
import { GuiDateTimePicker } from '@golemui/gui-components/date-time-picker';
import { GuiErrors } from '@golemui/gui-components/errors';
import { GuiLabel } from '@golemui/gui-components/label';
import { GuiList } from '@golemui/gui-components/list';
import { GuiMarkdown } from '@golemui/gui-components/markdown';
import { GuiMarkdownText } from '@golemui/gui-components/markdown-text';
import { GuiNumber } from '@golemui/gui-components/number';
import { GuiPassword } from '@golemui/gui-components/password';
import { GuiRadiogroup } from '@golemui/gui-components/radiogroup';
import { GuiRangeCalendar } from '@golemui/gui-components/range-calendar';
import { GuiRangeDateInput } from '@golemui/gui-components/range-date-input';
import { GuiRangeDateTimeInput } from '@golemui/gui-components/range-date-time-input';
import { GuiRangeTimeInput } from '@golemui/gui-components/range-time-input';
import { GuiRangeDatePicker } from '@golemui/gui-components/range-date-picker';
import { GuiRangeTimePicker } from '@golemui/gui-components/range-time-picker';
import { GuiSelect } from '@golemui/gui-components/select';
import { GuiTags } from '@golemui/gui-components/tags';
import { GuiTextarea } from '@golemui/gui-components/textarea';
import { GuiTextinput } from '@golemui/gui-components/textinput';
import { GuiTime } from '@golemui/gui-components/time-input';
import { GuiTimePicker } from '@golemui/gui-components/time-picker';
import { GuiToggle } from '@golemui/gui-components/toggle';

const wrap = <
  I extends HTMLElement,
  E extends Record<string, EventName | string> = Record<never, never>,
>(
  tagName: string,
  elementClass: { new (): I },
  events?: E,
) => createComponent({ react: React, tagName, elementClass, events });

export const GuiTextinputReact = wrap('gui-textinput', GuiTextinput, {
  onInput: 'input',
  onBlur: 'blur',
});
export const GuiTextareaReact = wrap('gui-textarea', GuiTextarea, {
  onInput: 'input',
  onBlur: 'blur',
});
export const GuiNumberReact = wrap('gui-number', GuiNumber, { onInput: 'input', onBlur: 'blur' });
export const GuiCurrencyReact = wrap('gui-currency', GuiCurrency, {
  onInput: 'input',
  onBlur: 'blur',
});
export const GuiPasswordReact = wrap('gui-password', GuiPassword, {
  onInput: 'input',
  onBlur: 'blur',
});
export const GuiMarkdownReact = wrap('gui-markdown', GuiMarkdown, {
  onInput: 'input',
  onBlur: 'blur',
});
export const GuiRadiogroupReact = wrap('gui-radiogroup', GuiRadiogroup, {
  onChange: 'change',
  onBlur: 'blur',
});
export const GuiToggleReact = wrap('gui-toggle', GuiToggle, { onChange: 'change', onBlur: 'blur' });
export const GuiCheckboxReact = wrap('gui-checkbox', GuiCheckbox, {
  onChange: 'change',
  onBlur: 'blur',
});
export const GuiTagsReact = wrap('gui-tags', GuiTags, { onChange: 'change', onBlur: 'blur' });
export const GuiSelectReact = wrap('gui-select', GuiSelect, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});

export const GuiCalendarReact = wrap('gui-calendar', GuiCalendar);
export const GuiDateTimeCalendarReact = wrap('gui-date-time-calendar', GuiDateTimeCalendar, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});
export const GuiRangeCalendarReact = wrap('gui-range-calendar', GuiRangeCalendar);
export const GuiDateReact = wrap('gui-date', GuiDate);
export const GuiDatePickerReact = wrap('gui-date-picker', GuiDatePicker, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});
export const GuiRangeDateReact = wrap('gui-range-date', GuiRangeDateInput);
export const GuiRangeDateTimeReact = wrap('gui-range-date-time', GuiRangeDateTimeInput);
export const GuiRangeTimeReact = wrap('gui-range-time', GuiRangeTimeInput);
export const GuiRangeDatePickerReact = wrap('gui-range-date-picker', GuiRangeDatePicker, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});
export const GuiTimeReact = wrap('gui-time', GuiTime);
export const GuiTimePickerReact = wrap('gui-time-picker', GuiTimePicker, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});
export const GuiRangeTimePickerReact = wrap('gui-range-time-picker', GuiRangeTimePicker, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});
export const GuiDateTimeReact = wrap('gui-date-time', GuiDateTime);
export const GuiDateTimePickerReact = wrap('gui-date-time-picker', GuiDateTimePicker, {
  onChange: 'change',
  onBlur: 'blur',
  onInputError: 'inputError',
});

export const GuiListReact = wrap('gui-list', GuiList);
export const GuiLabelReact = wrap('gui-label', GuiLabel);
export const GuiErrorsReact = wrap('gui-errors', GuiErrors);
export const GuiMarkdownTextReact = wrap('gui-markdown-text', GuiMarkdownText);

export const GuiButtonReact = wrap('gui-button', GuiButton, { onClick: 'click' });
