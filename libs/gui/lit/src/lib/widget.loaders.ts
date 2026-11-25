import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { GolemWidget } from '@golemui/gui-shared/internals';
import { type Type } from '@golemui/lit';

export const widgetLoaders: WidgetLoaders<Type<WithWidget>, GolemWidget> = {
  // ACTION
  button: async () => (await import('./components/button.element')).ButtonElement,
  menu: async () => (await import('./components/menu.element')).MenuElement,

  // INPUTS
  calendar: async () => (await import('./components/calendar.element')).CalendarElement,
  dateTimeCalendar: async () =>
    (await import('./components/date-time-calendar.element')).DateTimeCalendarElement,
  rangeCalendar: async () =>
    (await import('./components/range-calendar.element')).RangeCalendarElement,
  rangeDateInput: async () =>
    (await import('./components/range-date-input.element')).RangeDateInputElement,
  rangeDatePicker: async () =>
    (await import('./components/range-date-picker.element')).RangeDatePickerElement,
  rangeTimeInput: async () =>
    (await import('./components/range-time-input.element')).RangeTimeInputElement,
  rangeTimePicker: async () =>
    (await import('./components/range-time-picker.element')).RangeTimePickerElement,
  rangeDateTimeCalendar: async () =>
    (await import('./components/range-date-time-calendar.element')).RangeDateTimeCalendarElement,
  rangeDateTimeInput: async () =>
    (await import('./components/range-date-time-input.element')).RangeDateTimeInputElement,
  rangeDateTimePicker: async () =>
    (await import('./components/range-date-time-picker.element')).RangeDateTimePickerElement,
  multiRangeCalendar: async () =>
    (await import('./components/multi-range-calendar.element')).MultiRangeCalendarElement,
  multiRangeDateInput: async () =>
    (await import('./components/multi-range-date-input.element')).MultiRangeDateInputElement,
  multiRangeTimeInput: async () =>
    (await import('./components/multi-range-time-input.element')).MultiRangeTimeInputElement,
  multiRangeDateTimeInput: async () =>
    (await import('./components/multi-range-date-time-input.element'))
      .MultiRangeDateTimeInputElement,
  multiRangeDateTimeCalendar: async () =>
    (await import('./components/multi-range-date-time-calendar.element'))
      .MultiRangeDateTimeCalendarElement,
  multiRangeDateTimePicker: async () =>
    (await import('./components/multi-range-date-time-picker.element'))
      .MultiRangeDateTimePickerElement,
  multiRangeDatePicker: async () =>
    (await import('./components/multi-range-date-picker.element')).MultiRangeDatePickerElement,
  multiRangeTimePicker: async () =>
    (await import('./components/multi-range-time-picker.element')).MultiRangeTimePickerElement,
  currency: async () => (await import('./components/currency.element')).CurrencyElement,
  dateInput: async () => (await import('./components/date.element')).DateElement,
  datePicker: async () => (await import('./components/date-picker.element')).DatePickerElement,
  dateTimePicker: async () =>
    (await import('./components/date-time-picker.element')).DateTimePickerElement,
  dropdown: async () => (await import('./components/dropdown.element')).DropdownElement,
  fileUpload: async () => (await import('./components/file-upload.element')).FileUploadElement,
  list: async () => (await import('./components/list.element')).ListElement,
  markdown: async () => (await import('./components/markdown.element')).MarkdownElement,
  multiDropdown: async () =>
    (await import('./components/multi-dropdown.element')).MultiDropdownElement,
  multiFileUpload: async () =>
    (await import('./components/multi-file-upload.element')).MultiFileUploadElement,
  multiList: async () => (await import('./components/multi-list.element')).MultiListElement,
  password: async () => (await import('./components/password.element')).PasswordElement,
  textinput: async () => (await import('./components/textinput.element')).TextinputElement,
  timeInput: async () => (await import('./components/time.element')).TimeElement,
  timePicker: async () => (await import('./components/time-picker.element')).TimePickerElement,
  dateTimeInput: async () => (await import('./components/date-time.element')).DateTimeElement,
  textarea: async () => (await import('./components/textarea.element')).TextareaElement,
  toggle: async () => (await import('./components/toggle.element')).ToggleElement,
  checkbox: async () => (await import('./components/checkbox.element')).CheckboxElement,
  number: async () => (await import('./components/number.element')).NumberElement,
  radiogroup: async () => (await import('./components/radiogroup.element')).RadiogroupElement,
  checkboxGroup: async () =>
    (await import('./components/checkbox-group.element')).CheckboxGroupElement,
  rating: async () => (await import('./components/rating.element')).RatingElement,
  otp: async () => (await import('./components/otp.element')).OtpElement,
  slider: async () => (await import('./components/slider.element')).SliderElement,
  rangeSlider: async () => (await import('./components/range-slider.element')).RangeSliderElement,
  select: async () => (await import('./components/select.element')).SelectElement,
  tags: async () => (await import('./components/tags.element')).TagsElement,

  // REPEATER
  repeater: async () => (await import('./components/repeater.element')).RepeaterElement,

  // LAYOUTS
  grid: async () => (await import('./components/grid.element')).GridElement,
  tabs: async () => (await import('./components/tabs.element')).TabsElement,
  accordion: async () => (await import('./components/accordion.element')).AccordionElement,

  // DISPLAY
  alert: async () => (await import('./components/alert.element')).AlertElement,
  badge: async () => (await import('./components/badge.element')).BadgeElement,
  image: async () => (await import('./components/image.element')).ImageElement,
  progress: async () => (await import('./components/progress.element')).ProgressElement,
  spinner: async () => (await import('./components/spinner.element')).SpinnerElement,
  typography: async () => (await import('./components/typography.element')).TypographyElement,
  markdownText: async () =>
    (await import('./components/markdown-text.element')).MarkdownTextElement,
};
