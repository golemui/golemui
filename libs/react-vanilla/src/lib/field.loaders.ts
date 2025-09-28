import * as Core from '@formforge/core';

export const vanillaFieldLoaders: Core.FieldLoaders<
  React.ComponentType<Core.WithField>
> = {
  // BUTTON
  button: async () => (await import('./components/Button')).Button,

  // CONTROLS
  // textinput: async () =>
  //   (await import('./textinput/textinput.component')).TextinputComponent,
  // checkbox: async () =>
  //   (await import('./checkbox/checkbox.component')).CheckboxComponent,

  // // LAYOUTS
  stack: async () => (await import('./components/Stack')).Stack,

  // // FIELDS
  // alert: async () => (await import('./alert/alert.component')).AlertComponent,
};
