import { Type } from '@angular/core';
import * as Core from '@golemui/core';
import { VanillaWidget } from '@golemui/shared-vanilla';

export const vanillaWidgetLoaders: Core.WidgetLoaders<Type<Core.WithWidget>, VanillaWidget> = {
  // ACTION WIDGETS
  button: async () => (await import('./components/button/button.component')).ButtonComponent,

  // INPUT WIDGETS
  repeater: async () =>
    (await import('./components/repeater/repeater.component')).RepeaterComponent,
  textinput: async () =>
    (await import('./components/textinput/textinput.component')).TextinputComponent,
  currency: async () =>
    (await import('./components/currency/currency.component')).CurrencyComponent,
  textarea: async () =>
    (await import('./components/textarea/textarea.component')).TextareaComponent,
  calendar: async () =>
    (await import('./components/calendar/calendar.component')).CalendarComponent,
  rangeCalendar: async () =>
    (await import('./components/range-calendar/range-calendar.component')).RangeCalendarComponent,
  dateInput: async () => (await import('./components/date-input/date.component')).DateComponent,
  datePicker: async () =>
    (await import('./components/date-picker/date-picker.component')).DatePickerComponent,
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

  // LAYOUT WIDGETS
  flex: async () => (await import('./components/flex/flex.component')).FlexComponent,
  tabs: async () => (await import('./components/tabs/tabs.component')).TabsComponent,
  accordion: async () =>
    (await import('./components/accordion/accordion.component')).AccordionComponent,

  // DISPLAY WIDGETS
  alert: async () => (await import('./components/alert/alert.component')).AlertComponent,
  renderer: async () =>
    (await import('./components/renderer/renderer.component')).RendererComponent,
};
