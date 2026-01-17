import { Type } from '@angular/core';
import * as Core from '@golemui/core';
import { VanillaWidget } from '@golemui/shared-vanilla';

export const vanillaFieldLoaders: Core.FieldLoaders<Type<Core.WithField>, VanillaWidget> = {
  // INTERACTIVE FIELDS
  button: async () => (await import('./components/button/button.component')).ButtonComponent,

  // REPEATER
  repeater: async () =>
    (await import('./components/repeater/repeater.component')).RepeaterComponent,

  // CONTROLS
  textinput: async () =>
    (await import('./components/textinput/textinput.component')).TextinputComponent,
  currency: async () =>
    (await import('./components/currency/currency.component')).CurrencyComponent,
  textarea: async () =>
    (await import('./components/textarea/textarea.component')).TextareaComponent,
  calendar: async () =>
    (await import('./components/calendar/calendar.component')).CalendarComponent,
  dateInput: async () => (await import('./components/date-input/date.component')).DateComponent,
  datePicker: async () =>
    (await import('./components/date-picker/date-picker.component')).DatePickerComponent,
  toggle: async () => (await import('./components/toggle/toggle.component')).ToggleComponent,
  checkbox: async () =>
    (await import('./components/checkbox/checkbox.component')).CheckboxComponent,
  number: async () => (await import('./components/number/number.component')).NumberComponent,
  select: async () => (await import('./components/select/select.component')).SelectComponent,
  radiogroup: async () =>
    (await import('./components/radiogroup/radiogroup.component')).RadiogroupComponent,
  list: async () => (await import('./components/list/list.component')).ListComponent,

  // LAYOUTS
  stack: async () => (await import('./components/stack/stack.component')).StackComponent,
  tabs: async () => (await import('./components/tabs/tabs.component')).TabsComponent,
  accordion: async () =>
    (await import('./components/accordion/accordion.component')).AccordionComponent,

  // DISPLAY FIELDS
  alert: async () => (await import('./components/alert/alert.component')).AlertComponent,
};
