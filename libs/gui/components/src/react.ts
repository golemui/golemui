/**
 * React components for every GolemUI element, with typed props and `onGui*` event props.
 *
 * ```tsx
 * import { GuiTextinput } from '@golemui/gui-components/react';
 *
 * <GuiTextinput label="Name" onGuiChange={(event) => save(event.detail.value)} />;
 * ```
 */
import { createComponent, type EventName, type ReactWebComponent } from '@lit/react';
import React from 'react';
import { GuiButton as GuiButtonElement } from './lib/components/button';
import { GuiCalendar as GuiCalendarElement, GuiCalendarEvents } from './lib/components/calendar';
import { GuiCheckbox as GuiCheckboxElement, GuiCheckboxEvents } from './lib/components/checkbox';
import { GuiCurrency as GuiCurrencyElement, GuiCurrencyEvents } from './lib/components/currency';
import { GuiDate as GuiDateElement, GuiDateEvents } from './lib/components/date-input';
import {
  GuiDatePicker as GuiDatePickerElement,
  GuiDatePickerEvents,
} from './lib/components/date-picker';
import {
  GuiDateTime as GuiDateTimeElement,
  GuiDateTimeEvents,
} from './lib/components/date-time-input';
import {
  GuiDateTimeCalendar as GuiDateTimeCalendarElement,
  GuiDateTimeCalendarEvents,
} from './lib/components/date-time-calendar';
import {
  GuiDateTimePicker as GuiDateTimePickerElement,
  GuiDateTimePickerEvents,
} from './lib/components/date-time-picker';
import { GuiErrors as GuiErrorsElement } from './lib/components/errors';
import {
  GuiFileUpload as GuiFileUploadElement,
  GuiFileUploadEvents,
} from './lib/components/file-upload';
import { GuiLabel as GuiLabelElement } from './lib/components/label';
import { GuiList as GuiListElement, GuiListEvents } from './lib/components/list';
import { GuiMarkdown as GuiMarkdownElement, GuiMarkdownEvents } from './lib/components/markdown';
import { GuiMarkdownText as GuiMarkdownTextElement } from './lib/components/markdown-text';
import {
  GuiMultiFileUpload as GuiMultiFileUploadElement,
  GuiMultiFileUploadEvents,
} from './lib/components/multi-file-upload';
import {
  GuiMultiList as GuiMultiListElement,
  GuiMultiListEvents,
} from './lib/components/multi-list';
import {
  GuiMultiSelectTrigger as GuiMultiSelectTriggerElement,
  GuiMultiSelectTriggerEvents,
} from './lib/components/multi-select-trigger';
import { GuiNumber as GuiNumberElement, GuiNumberEvents } from './lib/components/number';
import { GuiPassword as GuiPasswordElement, GuiPasswordEvents } from './lib/components/password';
import { GuiPills as GuiPillsElement, GuiPillsEvents } from './lib/components/pills';
import {
  GuiRadiogroup as GuiRadiogroupElement,
  GuiRadiogroupEvents,
} from './lib/components/radiogroup';
import {
  GuiRangeCalendar as GuiRangeCalendarElement,
  GuiRangeCalendarEvents,
} from './lib/components/range-calendar';
import {
  GuiRangeDateInput as GuiRangeDateInputElement,
  GuiRangeDateInputEvents,
} from './lib/components/range-date-input';
import {
  GuiRangeDatePicker as GuiRangeDatePickerElement,
  GuiRangeDatePickerEvents,
} from './lib/components/range-date-picker';
import {
  GuiRangeDateTimeCalendar as GuiRangeDateTimeCalendarElement,
  GuiRangeDateTimeCalendarEvents,
} from './lib/components/range-date-time-calendar';
import {
  GuiRangeDateTimeInput as GuiRangeDateTimeInputElement,
  GuiRangeDateTimeInputEvents,
} from './lib/components/range-date-time-input';
import {
  GuiRangeDateTimePicker as GuiRangeDateTimePickerElement,
  GuiRangeDateTimePickerEvents,
} from './lib/components/range-date-time-picker';
import {
  GuiRangeTimeInput as GuiRangeTimeInputElement,
  GuiRangeTimeInputEvents,
} from './lib/components/range-time-input';
import {
  GuiRangeTimePicker as GuiRangeTimePickerElement,
  GuiRangeTimePickerEvents,
} from './lib/components/range-time-picker';
import { GuiSelect as GuiSelectElement, GuiSelectEvents } from './lib/components/select';
import { GuiTags as GuiTagsElement, GuiTagsEvents } from './lib/components/tags';
import { GuiTextarea as GuiTextareaElement, GuiTextareaEvents } from './lib/components/textarea';
import {
  GuiTextinput as GuiTextinputElement,
  GuiTextinputEvents,
} from './lib/components/textinput';
import { GuiTime as GuiTimeElement, GuiTimeEvents } from './lib/components/time-input';
import { GuiTimeList as GuiTimeListElement, GuiTimeListEvents } from './lib/components/time-list';
import {
  GuiTimePicker as GuiTimePickerElement,
  GuiTimePickerEvents,
} from './lib/components/time-picker';
import { GuiToggle as GuiToggleElement, GuiToggleEvents } from './lib/components/toggle';
import { fires, type GuiEventMap } from './lib/utils/events';

/** `gui-pill-remove` → `GuiPillRemove`. */
type PascalCase<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Capitalize<Head>}${PascalCase<Tail>}`
  : Capitalize<Name>;

/** The `on*` prop of each event in an events map: `gui-change` → `onGuiChange`. */
type ReactEvents<Events> = {
  [Name in keyof GuiEventMap<Events> & string as `on${PascalCase<Name>}`]: EventName<
    GuiEventMap<Events>[Name]
  >;
};

const eventProp = (name: string) =>
  `on${name.replace(/(?:^|-)(\w)/g, (_match, letter: string) => letter.toUpperCase())}`;

function wrap<I extends HTMLElement, Events extends object = Record<never, never>>(
  tagName: string,
  elementClass: { new (): I },
  eventMap?: Events,
): ReactWebComponent<I, ReactEvents<Events>> {
  const events = Object.fromEntries(
    Object.keys(eventMap ?? {}).map((name) => [eventProp(name), name]),
  ) as ReactEvents<Events>;
  const Component: React.ElementType = createComponent({
    react: React,
    tagName,
    elementClass,
    events,
  });

  // The `defer-hydration` attribute keeps a server-rendered element empty until React has
  // hydrated it (the element renders into light DOM, so an early Lit render would add
  // children the server markup does not have and hydration would fail on them). It is an
  // unknown non-event prop, so it reaches the markup as an attribute on the server and
  // the client alike, and the @lit/react wrapper removes it right after mount. In a
  // client-only app the removal happens in the same commit the element connects in, so
  // the first Lit render stays on its usual schedule.
  const WithDeferredHydration = React.forwardRef<I, object>(
    function WithDeferredHydration(props, ref) {
      return React.createElement(Component, { ...props, ref, 'defer-hydration': '' });
    },
  );
  WithDeferredHydration.displayName = `WithDeferredHydration(${tagName})`;
  // It forwards every prop to the @lit/react component, so it takes the same props.
  return WithDeferredHydration as ReactWebComponent<I, ReactEvents<Events>>;
}

// The native click, so `onClick` receives the DOM event rather than React's synthetic one.
export const GuiButton = wrap('gui-button', GuiButtonElement, { click: fires<MouseEvent>() });
export const GuiCalendar = wrap('gui-calendar', GuiCalendarElement, GuiCalendarEvents);
export const GuiCheckbox = wrap('gui-checkbox', GuiCheckboxElement, GuiCheckboxEvents);
export const GuiCurrency = wrap('gui-currency', GuiCurrencyElement, GuiCurrencyEvents);
export const GuiDate = wrap('gui-date', GuiDateElement, GuiDateEvents);
export const GuiDatePicker = wrap('gui-date-picker', GuiDatePickerElement, GuiDatePickerEvents);
export const GuiDateTime = wrap('gui-date-time', GuiDateTimeElement, GuiDateTimeEvents);
export const GuiDateTimeCalendar = wrap(
  'gui-date-time-calendar',
  GuiDateTimeCalendarElement,
  GuiDateTimeCalendarEvents,
);
export const GuiDateTimePicker = wrap(
  'gui-date-time-picker',
  GuiDateTimePickerElement,
  GuiDateTimePickerEvents,
);
export const GuiErrors = wrap('gui-errors', GuiErrorsElement);
export const GuiFileUpload = wrap('gui-file-upload', GuiFileUploadElement, GuiFileUploadEvents);
export const GuiLabel = wrap('gui-label', GuiLabelElement);
export const GuiList = wrap('gui-list', GuiListElement, GuiListEvents);
export const GuiMarkdown = wrap('gui-markdown', GuiMarkdownElement, GuiMarkdownEvents);
export const GuiMarkdownText = wrap('gui-markdown-text', GuiMarkdownTextElement);
export const GuiMultiFileUpload = wrap(
  'gui-multi-file-upload',
  GuiMultiFileUploadElement,
  GuiMultiFileUploadEvents,
);
export const GuiMultiList = wrap('gui-multi-list', GuiMultiListElement, GuiMultiListEvents);
export const GuiMultiSelectTrigger = wrap(
  'gui-multi-select-trigger',
  GuiMultiSelectTriggerElement,
  GuiMultiSelectTriggerEvents,
);
export const GuiNumber = wrap('gui-number', GuiNumberElement, GuiNumberEvents);
export const GuiPassword = wrap('gui-password', GuiPasswordElement, GuiPasswordEvents);
export const GuiPills = wrap('gui-pills', GuiPillsElement, GuiPillsEvents);
export const GuiRadiogroup = wrap('gui-radiogroup', GuiRadiogroupElement, GuiRadiogroupEvents);
export const GuiRangeCalendar = wrap(
  'gui-range-calendar',
  GuiRangeCalendarElement,
  GuiRangeCalendarEvents,
);
export const GuiRangeDateInput = wrap(
  'gui-range-date',
  GuiRangeDateInputElement,
  GuiRangeDateInputEvents,
);
export const GuiRangeDatePicker = wrap(
  'gui-range-date-picker',
  GuiRangeDatePickerElement,
  GuiRangeDatePickerEvents,
);
export const GuiRangeDateTimeCalendar = wrap(
  'gui-range-date-time-calendar',
  GuiRangeDateTimeCalendarElement,
  GuiRangeDateTimeCalendarEvents,
);
export const GuiRangeDateTimeInput = wrap(
  'gui-range-date-time',
  GuiRangeDateTimeInputElement,
  GuiRangeDateTimeInputEvents,
);
export const GuiRangeDateTimePicker = wrap(
  'gui-range-date-time-picker',
  GuiRangeDateTimePickerElement,
  GuiRangeDateTimePickerEvents,
);
export const GuiRangeTimeInput = wrap(
  'gui-range-time',
  GuiRangeTimeInputElement,
  GuiRangeTimeInputEvents,
);
export const GuiRangeTimePicker = wrap(
  'gui-range-time-picker',
  GuiRangeTimePickerElement,
  GuiRangeTimePickerEvents,
);
export const GuiSelect = wrap('gui-select', GuiSelectElement, GuiSelectEvents);
export const GuiTags = wrap('gui-tags', GuiTagsElement, GuiTagsEvents);
export const GuiTextarea = wrap('gui-textarea', GuiTextareaElement, GuiTextareaEvents);
export const GuiTextinput = wrap('gui-textinput', GuiTextinputElement, GuiTextinputEvents);
export const GuiTime = wrap('gui-time', GuiTimeElement, GuiTimeEvents);
export const GuiTimeList = wrap('gui-time-list', GuiTimeListElement, GuiTimeListEvents);
export const GuiTimePicker = wrap('gui-time-picker', GuiTimePickerElement, GuiTimePickerEvents);
export const GuiToggle = wrap('gui-toggle', GuiToggleElement, GuiToggleEvents);
