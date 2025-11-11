import { Type } from '@angular/core';
import * as Core from '@golemui/core';

export const vanillaFieldLoaders: Core.FieldLoaders<Type<Core.WithField>> = {
  // BUTTON
  button: async () => (await import('./button/button.component')).ButtonComponent,

  // REPEATER
  repeater: async () => (await import('./repeater/repeater.component')).RepeaterComponent,

  // CONTROLS
  textinput: async () => (await import('./textinput/textinput.component')).TextinputComponent,
  checkbox: async () => (await import('./checkbox/checkbox.component')).CheckboxComponent,
  select: async () => (await import('./select/select.component')).SelectComponent,

  // LAYOUTS
  stack: async () => (await import('./stack/stack.component')).StackComponent,
  tabs: async () => (await import('./tabs/tabs.component')).TabsComponent,
  accordion: async () => (await import('./accordion/accordion.component')).AccordionComponent,

  // FIELDS
  alert: async () => (await import('./alert/alert.component')).AlertComponent,
};
