import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.flex([
    gui.inputs.textInput('h1', {
      label: 'Left Field',
      uid: 'h1',
    }),
    gui.inputs.textInput('h2', {
      label: 'Right Field',
      uid: 'h2',
    }),
  ], {
    direction: 'row',
    uid: 'flex_horizontal',
  }),
];
