import { Type } from '@angular/core';
import * as Core from '@formforge/core';

export const vanillaFieldLoaders: Core.FieldLoaders<Type<Core.WithField>> = {
  // BUTTON
  button: async () =>
    (await import('./button/button.component')).ButtonComponent,

  // CONTROLS
  textinput: async () =>
    (await import('./textinput/textinput.component')).TextinputComponent,
  checkbox: async () =>
    (await import('./checkbox/checkbox.component')).CheckboxComponent,

  // LAYOUTS
  stack: async () => (await import('./stack/stack.component')).StackComponent,

  // FIELDS
  alert: async () => (await import('./alert/alert.component')).AlertComponent,
};
