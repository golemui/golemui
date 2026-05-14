import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.booleanInput('darkMode', {
    togglePosition: 'right',
    label: 'Dark mode',
  }),
];
