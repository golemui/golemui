import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.checkbox('acceptConditions', {
    checkboxPosition: 'left',
    label: 'Yes, I have read terms and conditions',
  }),
];
