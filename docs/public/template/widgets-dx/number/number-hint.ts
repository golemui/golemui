import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.numberInput('number', {
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    label: 'Phone Number',
  }),
];
