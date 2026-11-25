import { type Type } from '@angular/core';
import type { WidgetLoaders, WithWidget } from '@golemui/core';
import type { GolemWidget } from '@golemui/gui-shared/internals';

export const widgetLoaders: WidgetLoaders<Type<WithWidget>, GolemWidget> = {
  // ACTION WIDGETS
  button: async () => (await import('./components/button/button.component')).ButtonComponent,
  menuButton: async () =>
    (await import('./components/menu-button/menu-button.component')).MenuButtonComponent,

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
  rangeDatePicker: async () =>
    (await import('./components/range-date-picker/range-date-picker.component'))
      .RangeDatePickerComponent,
  rangeTimeInput: async () =>
    (await import('./components/range-time/range-time.component')).RangeTimeComponent,
  rangeTimePicker: async () =>
    (await import('./components/range-time-picker/range-time-picker.component'))
      .RangeTimePickerComponent,
  rangeDateTimeCalendar: async () =>
    (await import('./components/range-date-time-calendar/range-date-time-calendar.component'))
      .RangeDateTimeCalendarComponent,
  rangeDateTimeInput: async () =>
    (await import('./components/range-date-time/range-date-time.component')).RangeDateTimeComponent,
  rangeDateTimePicker: async () =>
    (await import('./components/range-date-time-picker/range-date-time-picker.component'))
      .RangeDateTimePickerComponent,
  multiRangeCalendar: async () =>
    (await import('./components/multi-range-calendar/multi-range-calendar.component'))
      .MultiRangeCalendarComponent,
  multiRangeDateInput: async () =>
    (await import('./components/multi-range-date/multi-range-date.component'))
      .MultiRangeDateComponent,
  multiRangeTimeInput: async () =>
    (await import('./components/multi-range-time/multi-range-time.component'))
      .MultiRangeTimeComponent,
  multiRangeDateTimeInput: async () =>
    (await import('./components/multi-range-date-time/multi-range-date-time.component'))
      .MultiRangeDateTimeComponent,
  multiRangeDateTimeCalendar: async () =>
    (
      await import(
        './components/multi-range-date-time-calendar/multi-range-date-time-calendar.component'
      )
    ).MultiRangeDateTimeCalendarComponent,
  multiRangeDateTimePicker: async () =>
    (
      await import(
        './components/multi-range-date-time-picker/multi-range-date-time-picker.component'
      )
    ).MultiRangeDateTimePickerComponent,
  multiRangeDatePicker: async () =>
    (await import('./components/multi-range-date-picker/multi-range-date-picker.component'))
      .MultiRangeDatePickerComponent,
  multiRangeTimePicker: async () =>
    (await import('./components/multi-range-time-picker/multi-range-time-picker.component'))
      .MultiRangeTimePickerComponent,
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
  checkboxGroup: async () =>
    (await import('./components/checkbox-group/checkbox-group.component')).CheckboxGroupComponent,
  rating: async () => (await import('./components/rating/rating.component')).RatingComponent,
  otp: async () => (await import('./components/otp/otp.component')).OtpComponent,
  slider: async () => (await import('./components/slider/slider.component')).SliderComponent,
  rangeSlider: async () =>
    (await import('./components/range-slider/range-slider.component')).RangeSliderComponent,
  list: async () => (await import('./components/list/list.component')).ListComponent,
  markdown: async () =>
    (await import('./components/markdown/markdown.component')).MarkdownComponent,
  multiDropdown: async () =>
    (await import('./components/multi-dropdown/multi-dropdown.component')).MultiDropdownComponent,
  multiList: async () =>
    (await import('./components/multi-list/multi-list.component')).MultiListComponent,
  fileUpload: async () =>
    (await import('./components/file-upload/file-upload.component')).FileUploadComponent,
  multiFileUpload: async () =>
    (await import('./components/multi-file-upload/multi-file-upload.component'))
      .MultiFileUploadComponent,
  tags: async () => (await import('./components/tags/tags.component')).TagsComponent,

  // LAYOUT WIDGETS
  grid: async () => (await import('./components/grid/grid.component')).GridComponent,
  tabs: async () => (await import('./components/tabs/tabs.component')).TabsComponent,
  accordion: async () =>
    (await import('./components/accordion/accordion.component')).AccordionComponent,

  // DISPLAY WIDGETS
  alert: async () => (await import('./components/alert/alert.component')).AlertComponent,
  badge: async () => (await import('./components/badge/badge.component')).BadgeComponent,
  image: async () => (await import('./components/image/image.component')).ImageComponent,
  progress: async () =>
    (await import('./components/progress/progress.component')).ProgressComponent,
  spinner: async () => (await import('./components/spinner/spinner.component')).SpinnerComponent,
  typography: async () =>
    (await import('./components/typography/typography.component')).TypographyComponent,
  markdownText: async () =>
    (await import('./components/markdown-text/markdown-text.component')).MarkdownTextComponent,
};
