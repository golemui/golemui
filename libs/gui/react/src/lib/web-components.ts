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
import { GuiFileUpload } from '@golemui/gui-components/file-upload';
import { GuiLabel } from '@golemui/gui-components/label';
import { GuiList } from '@golemui/gui-components/list';
import { GuiMarkdown } from '@golemui/gui-components/markdown';
import { GuiMarkdownText } from '@golemui/gui-components/markdown-text';
import { GuiMultiFileUpload } from '@golemui/gui-components/multi-file-upload';
import { GuiMultiList } from '@golemui/gui-components/multi-list';
import { GuiMultiSelectTrigger } from '@golemui/gui-components/multi-select-trigger';
import { GuiNumber } from '@golemui/gui-components/number';
import { GuiPassword } from '@golemui/gui-components/password';
import { GuiRadiogroup } from '@golemui/gui-components/radiogroup';
import { GuiRangeCalendar } from '@golemui/gui-components/range-calendar';
import { GuiRangeDateInput } from '@golemui/gui-components/range-date-input';
import { GuiRangeDateTimeInput } from '@golemui/gui-components/range-date-time-input';
import { GuiRangeDateTimeCalendar } from '@golemui/gui-components/range-date-time-calendar';
import { GuiRangeDateTimePicker } from '@golemui/gui-components/range-date-time-picker';
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
) => {
  const LitComponent = createComponent({ react: React, tagName, elementClass, events });
  type LitComponentProps = React.ComponentProps<typeof LitComponent>;

  // The `defer-hydration` attribute keeps a server-rendered element empty until React has
  // hydrated it (the element renders into light DOM, so an early Lit render would add
  // children the server markup does not have and hydration would fail on them). It is an
  // unknown non-event prop, so it reaches the markup as an attribute on the server and
  // the client alike, and the @lit/react wrapper removes it right after mount. In a
  // client-only app the removal happens in the same commit the element connects in, so
  // the first Lit render stays on its usual schedule.
  const WithDeferredHydration = React.forwardRef<I, LitComponentProps>(
    function WithDeferredHydration(props, ref) {
      return React.createElement(LitComponent, {
        ...props,
        ref,
        'defer-hydration': '',
      } as LitComponentProps);
    },
  );
  WithDeferredHydration.displayName = `WithDeferredHydration(${tagName})`;
  return WithDeferredHydration;
};

export const GuiTextinputReact = wrap('gui-textinput', GuiTextinput, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiTextareaReact = wrap('gui-textarea', GuiTextarea, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiNumberReact = wrap('gui-number', GuiNumber, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiCurrencyReact = wrap('gui-currency', GuiCurrency, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiPasswordReact = wrap('gui-password', GuiPassword, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiMarkdownReact = wrap('gui-markdown', GuiMarkdown, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiRadiogroupReact = wrap('gui-radiogroup', GuiRadiogroup, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiToggleReact = wrap('gui-toggle', GuiToggle, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiCheckboxReact = wrap('gui-checkbox', GuiCheckbox, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiTagsReact = wrap('gui-tags', GuiTags, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
});
export const GuiFileUploadReact = wrap('gui-file-upload', GuiFileUpload, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiMultiFileUploadReact = wrap('gui-multi-file-upload', GuiMultiFileUpload, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiSelectReact = wrap('gui-select', GuiSelect, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});

export const GuiCalendarReact = wrap('gui-calendar', GuiCalendar);
export const GuiDateTimeCalendarReact = wrap('gui-date-time-calendar', GuiDateTimeCalendar, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiRangeCalendarReact = wrap('gui-range-calendar', GuiRangeCalendar);
export const GuiDateReact = wrap('gui-date', GuiDate);
export const GuiDatePickerReact = wrap('gui-date-picker', GuiDatePicker, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiRangeDateReact = wrap('gui-range-date', GuiRangeDateInput);
export const GuiRangeDateTimeReact = wrap('gui-range-date-time', GuiRangeDateTimeInput);
export const GuiRangeDateTimeCalendarReact = wrap(
  'gui-range-date-time-calendar',
  GuiRangeDateTimeCalendar,
  {
    onGuiInput: 'gui-input',
    onGuiChange: 'gui-change',
    onGuiBlur: 'gui-blur',
    onGuiInputError: 'gui-input-error',
  },
);
export const GuiRangeDateTimePickerReact = wrap(
  'gui-range-date-time-picker',
  GuiRangeDateTimePicker,
  {
    onGuiInput: 'gui-input',
    onGuiChange: 'gui-change',
    onGuiBlur: 'gui-blur',
    onGuiInputError: 'gui-input-error',
  },
);
export const GuiRangeTimeReact = wrap('gui-range-time', GuiRangeTimeInput);
export const GuiRangeDatePickerReact = wrap('gui-range-date-picker', GuiRangeDatePicker, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiTimeReact = wrap('gui-time', GuiTime);
export const GuiTimePickerReact = wrap('gui-time-picker', GuiTimePicker, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiRangeTimePickerReact = wrap('gui-range-time-picker', GuiRangeTimePicker, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});
export const GuiDateTimeReact = wrap('gui-date-time', GuiDateTime);
export const GuiDateTimePickerReact = wrap('gui-date-time-picker', GuiDateTimePicker, {
  onGuiInput: 'gui-input',
  onGuiChange: 'gui-change',
  onGuiBlur: 'gui-blur',
  onGuiInputError: 'gui-input-error',
});

export const GuiListReact = wrap('gui-list', GuiList);
export const GuiMultiListReact = wrap('gui-multi-list', GuiMultiList);
export const GuiMultiSelectTriggerReact = wrap('gui-multi-select-trigger', GuiMultiSelectTrigger, {
  onGuiPillRemove: 'gui-pill-remove',
  onGuiDropdownToggle: 'gui-dropdown-toggle',
});
export const GuiLabelReact = wrap('gui-label', GuiLabel);
export const GuiErrorsReact = wrap('gui-errors', GuiErrors);
export const GuiMarkdownTextReact = wrap('gui-markdown-text', GuiMarkdownText);

export const GuiButtonReact = wrap('gui-button', GuiButton, { onClick: 'click' });
