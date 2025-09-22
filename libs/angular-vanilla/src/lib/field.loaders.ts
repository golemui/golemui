import * as Angular from '@formforge/angular';

export const vanillaFieldLoaders: Angular.FieldLoaders = {
  // CONTROLS
  textinput: async () =>
    (await import('./textinput/textinput.component')).TextinputComponent,
  checkbox: async () =>
    (await import('./checkbox/checkbox.component')).CheckboxComponent,

  // LAYOUTS
  stack: async () => (await import('./stack/stack.component')).StackComponent,
};
