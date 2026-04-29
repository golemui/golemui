import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.flex([
    gui.inputs.textInput('v1', {
      label: 'Vertical Field 1',
      uid: 'v1',
    }),
    gui.inputs.textInput('v2', {
      label: 'Vertical Field 2',
      uid: 'v2',
    }),
  ], {
    direction: 'column',
    uid: 'flex_vertical',
  }),
];
