import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.flex([
    gui.inputs.textInput('firstName', {
      label: 'First Name',
      size: 1,
      uid: 'f1',
    }),
    gui.inputs.textInput('lastName', {
      label: 'Last Name',
      size: 1,
      uid: 'f2',
    }),
  ], {
    direction: 'row',
    justify: 'center',
    align: 'center',
    gap: 16,
    uid: 'row_centered',
  }),
];
