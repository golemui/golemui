import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.flex([
    gui.inputs.textInput('cr1', {
      label: 'First Field',
      uid: 'cr1',
    }),
    gui.inputs.textInput('cr2', {
      label: 'Second Field',
      uid: 'cr2',
    }),
  ], {
    direction: 'column-reverse',
    uid: 'flex_column_reverse',
  }),
];
