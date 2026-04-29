import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textInput('password', {
    hint: 'Your street address as stated in your Document ID',
    label: 'Street Address',
  }),
];
