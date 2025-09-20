import * as Angular from '@formforge/angular';

export const vanillaFieldLoaders: Angular.FieldLoaders = {
  textinput: async () =>
    (await import('./textinput/textinput.component')).TextinputComponent,
  stack: async () => (await import('./stack/stack.component')).StackComponent,
};
