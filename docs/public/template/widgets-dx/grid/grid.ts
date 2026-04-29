import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.grid([
    gui.inputs.textInput('c1', {
      label: 'Column Field 1',
      uid: 'c1',
    }),
    gui.inputs.textInput('c2', {
      label: 'Column Field 2',
      uid: 'c2',
    }),
  ], {
    direction: 'column',
    uid: 'grid_column',
  }),
];
