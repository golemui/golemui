import * as Core from '@golemui/core';
import '@golemui/gui-components';
import { GolemWidget } from '@golemui/gui-shared';
import { Type } from '@golemui/lit';

export const golemWidgetLoaders: Core.WidgetLoaders<Type<Core.WithWidget>, GolemWidget> = {
  // ACTION
  button: async () => (await import('./components/button.element')).ButtonElement,

  // INPUTS
  calendar: async () => (await import('./components/calendar.element')).CalendarElement,
  rangeCalendar: async () =>
    (await import('./components/range-calendar.element')).RangeCalendarElement,
  rangeDateInput: async () =>
    (await import('./components/range-date-input.element')).RangeDateInputElement,
  rangeDatePicker: async () =>
    (await import('./components/range-date-picker.element')).RangeDatePickerElement,
  currency: async () => (await import('./components/currency.element')).CurrencyElement,
  dateInput: async () => (await import('./components/date.element')).DateElement,
  datePicker: async () => (await import('./components/date-picker.element')).DatePickerElement,
  dropdown: async () => (await import('./components/dropdown.element')).DropdownElement,
  list: async () => (await import('./components/list.element')).ListElement,
  markdown: async () => (await import('./components/markdown.element')).MarkdownElement,
  password: async () => (await import('./components/password.element')).PasswordElement,
  textinput: async () => (await import('./components/textinput.element')).TextinputElement,
  textarea: async () => (await import('./components/textarea.element')).TextareaElement,
  toggle: async () => (await import('./components/toggle.element')).ToggleElement,
  checkbox: async () => (await import('./components/checkbox.element')).CheckboxElement,
  number: async () => (await import('./components/number.element')).NumberElement,
  radiogroup: async () => (await import('./components/radiogroup.element')).RadiogroupElement,
  select: async () => (await import('./components/select.element')).SelectElement,

  // REPEATER
  repeater: async () => (await import('./components/repeater.element')).RepeaterElement,

  // LAYOUTS
  flex: async () => (await import('./components/flex.element')).FlexElement,
  grid: async () => (await import('./components/grid.element')).GridElement,
  tabs: async () => (await import('./components/tabs.element')).TabsElement,
  accordion: async () => (await import('./components/accordion.element')).AccordionElement,

  // DISPLAY
  alert: async () => (await import('./components/alert.element')).AlertElement,
  markdownText: async () =>
    (await import('./components/markdown-text.element')).MarkdownTextElement,
  renderer: async () => (await import('./components/renderer.element')).RendererElement,
};
