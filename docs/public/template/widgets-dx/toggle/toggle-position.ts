import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.booleanInput('darkMode', {
    togglePosition: 'left',
    label: 'Dark mode',
  }),
];
