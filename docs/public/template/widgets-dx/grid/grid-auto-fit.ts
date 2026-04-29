import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.grid([
    gui.inputs.textInput('firstName', {
      label: 'First Name',
      uid: 'af1',
    }),
    gui.inputs.textInput('lastName', {
      label: 'Last Name',
      uid: 'af2',
    }),
    gui.inputs.textInput('email', {
      label: 'Email',
      uid: 'af3',
    }),
  ], {
    direction: 'row',
    autoFit: true,
    uid: 'grid_auto_fit',
  }),
];
