import * as Core from '@golemui/core';
import { Type } from '@golemui/lit';
import { VanillaWidget } from '@golemui/shared-vanilla';

export const vanillaWidgetLoaders: Core.WidgetLoaders<Type<Core.WithWidget>, VanillaWidget> = {
  // ACTION
  button: async () => (await import('./components/button.element')).ButtonElement,

  // INPUTS
  calendar: async () => (await import('./components/calendar.element')).CalendarElement,
  rangeCalendar: async () =>
    (await import('./components/range-calendar.element')).RangeCalendarElement,
  currency: async () => (await import('./components/currency.element')).CurrencyElement,
  dateInput: async () => (await import('./components/date.element')).DateElement,
  datePicker: async () => (await import('./components/date-picker.element')).DatePickerElement,
  dropdown: async () => (await import('./components/dropdown.element')).DropdownElement,
  list: async () => (await import('./components/list.element')).ListElement,
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
  stack: async () => (await import('./components/stack.element')).StackElement,
  tabs: async () => (await import('./components/tabs.element')).TabsElement,
  accordion: async () => (await import('./components/accordion.element')).AccordionElement,

  // DISPLAY
  alert: async () => (await import('./components/alert.element')).AlertElement,
  renderer: async () => (await import('./components/renderer.element')).RendererElement,
};
