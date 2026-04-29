import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.grid([
    gui.layouts.grid([
      gui.inputs.textInput('n1', {
        label: 'First Name',
        uid: 'n1',
      }),
      gui.inputs.textInput('n2', {
        label: 'Last Name',
        uid: 'n2',
      }),
    ], {
      direction: 'row',
      uid: 'grid_row_1',
    }),
    gui.layouts.grid([
      gui.inputs.textInput('n3', {
        label: 'Email',
        uid: 'n3',
      }),
      gui.inputs.textInput('n4', {
        label: 'Phone',
        uid: 'n4',
      }),
    ], {
      direction: 'row',
      uid: 'grid_row_2',
    }),
  ], {
    direction: 'column',
    uid: 'grid_outer',
  }),
];
