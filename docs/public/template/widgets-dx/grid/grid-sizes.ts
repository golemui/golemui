import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.grid([
    gui.inputs.textInput('s1', {
      label: 'Default Size (1)',
      uid: 's1',
    }),
    gui.inputs.textInput('s2', {
      label: 'Size 2',
      uid: 's2',
    }),
  ], {
    direction: 'row',
    uid: 'grid_sizes',
  }),
];
