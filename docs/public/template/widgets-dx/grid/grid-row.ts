import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.grid([
    gui.inputs.textInput('r1', {
      label: 'Left Field',
      uid: 'r1',
    }),
    gui.inputs.textInput('r2', {
      label: 'Right Field',
      uid: 'r2',
    }),
  ], {
    direction: 'row',
    uid: 'grid_row',
  }),
];
