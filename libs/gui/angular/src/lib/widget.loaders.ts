import { type Type } from '@angular/core';
import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { GolemWidget } from '@golemui/gui-shared/internals';

export const widgetLoaders: WidgetLoaders<Type<WithWidget>, GolemWidget> = {
  // ACTION WIDGETS
  button: async () => (await import('./components/button/button.component')).ButtonComponent,

  // INPUT WIDGETS
  repeater: async () =>
    (await import('./components/repeater/repeater.component')).RepeaterComponent,
  textinput: async () =>
    (await import('./components/textinput/textinput.component')).TextinputComponent,
  password: async () =>
    (await import('./components/password/password.component')).PasswordComponent,
  currency: async () =>
    (await import('./components/currency/currency.component')).CurrencyComponent,
  textarea: async () =>
    (await import('./components/textarea/textarea.component')).TextareaComponent,
  calendar: async () =>
    (await import('./components/calendar/calendar.component')).CalendarComponent,
  dateTimeCalendar: async () =>
    (await import('./components/date-time-calendar/date-time-calendar.component'))
      .DateTimeCalendarComponent,
  rangeCalendar: async () =>
    (await import('./components/range-calendar/range-calendar.component')).RangeCalendarComponent,
  rangeDateInput: async () =>
    (await import('./components/range-date/range-date.component')).RangeDateComponent,
  rangeTimeInput: async () =>
    (await import('./components/range-time/range-time.component')).RangeTimeComponent,
  rangeDateTimeInput: async () =>
    (await import('./components/range-date-time/range-date-time.component')).RangeDateTimeComponent,
  rangeDatePicker: async () =>
    (await import('./components/range-date-picker/range-date-picker.component'))
      .RangeDatePickerComponent,
  rangeTimePicker: async () =>
    (await import('./components/range-time-picker/range-time-picker.component'))
      .RangeTimePickerComponent,
  dateInput: async () => (await import('./components/date-input/date.component')).DateComponent,
  timeInput: async () => (await import('./components/time-input/time.component')).TimeComponent,
  timePicker: async () =>
    (await import('./components/time-picker/time-picker.component')).TimePickerComponent,
  dateTimeInput: async () =>
    (await import('./components/date-time-input/date-time.component')).DateTimeComponent,
  datePicker: async () =>
    (await import('./components/date-picker/date-picker.component')).DatePickerComponent,
  dateTimePicker: async () =>
    (await import('./components/date-time-picker/date-time-picker.component'))
      .DateTimePickerComponent,
  dropdown: async () =>
    (await import('./components/dropdown/dropdown.component')).DropdownComponent,
  toggle: async () => (await import('./components/toggle/toggle.component')).ToggleComponent,
  checkbox: async () =>
    (await import('./components/checkbox/checkbox.component')).CheckboxComponent,
  number: async () => (await import('./components/number/number.component')).NumberComponent,
  select: async () => (await import('./components/select/select.component')).SelectComponent,
  radiogroup: async () =>
    (await import('./components/radiogroup/radiogroup.component')).RadiogroupComponent,
  list: async () => (await import('./components/list/list.component')).ListComponent,
  markdown: async () =>
    (await import('./components/markdown/markdown.component')).MarkdownComponent,
  tags: async () => (await import('./components/tags/tags.component')).TagsComponent,

  // LAYOUT WIDGETS
  flex: async () => (await import('./components/flex/flex.component')).FlexComponent,
  grid: async () => (await import('./components/grid/grid.component')).GridComponent,
  tabs: async () => (await import('./components/tabs/tabs.component')).TabsComponent,
  accordion: async () =>
    (await import('./components/accordion/accordion.component')).AccordionComponent,

  // DISPLAY WIDGETS
  alert: async () => (await import('./components/alert/alert.component')).AlertComponent,
  markdownText: async () =>
    (await import('./components/markdown-text/markdown-text.component')).MarkdownTextComponent,
  renderer: async () =>
    (await import('./components/renderer/renderer.component')).RendererComponent,
};
