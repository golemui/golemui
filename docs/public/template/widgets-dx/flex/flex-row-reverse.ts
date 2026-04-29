import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.flex([
    gui.inputs.textInput('rr1', {
      label: 'First Field',
      uid: 'rr1',
    }),
    gui.inputs.textInput('rr2', {
      label: 'Second Field',
      uid: 'rr2',
    }),
  ], {
    direction: 'row-reverse',
    uid: 'flex_row_reverse',
  }),
];
