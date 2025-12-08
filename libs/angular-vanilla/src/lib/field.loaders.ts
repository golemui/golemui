import { Type } from '@angular/core';
import * as Core from '@golemui/core';

export const vanillaFieldLoaders: Core.FieldLoaders<Type<Core.WithField>> = {
  // BUTTON
  button: async () => (await import('./components/button/button.component')).ButtonComponent,

  // REPEATER
  repeater: async () =>
    (await import('./components/repeater/repeater.component')).RepeaterComponent,

  // CONTROLS
  textinput: async () =>
    (await import('./components/textinput/textinput.component')).TextinputComponent,
  checkbox: async () =>
    (await import('./components/checkbox/checkbox.component')).CheckboxComponent,
  number: async () => (await import('./components/number/number.component')).NumberComponent,
  select: async () => (await import('./components/select/select.component')).SelectComponent,
  radiogroup: async () =>
    (await import('./components/radiogroup/radiogroup.component')).RadiogroupComponent,

  // LAYOUTS
  stack: async () => (await import('./components/stack/stack.component')).StackComponent,
  tabs: async () => (await import('./components/tabs/tabs.component')).TabsComponent,
  accordion: async () =>
    (await import('./components/accordion/accordion.component')).AccordionComponent,

  // FIELDS
  alert: async () => (await import('./components/alert/alert.component')).AlertComponent,
};
