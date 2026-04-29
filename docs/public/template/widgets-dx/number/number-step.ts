import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.numberInput('height', {
    step: 0.01,
    label: 'Height in meters',
  }),
];
