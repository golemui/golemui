import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.radiogroup('preference', {
    options: [
      {
        label: 'Email',
        value: 'email',
      },
      {
        label: 'SMS',
        value: 'sms',
      },
    ],
    hint: 'We will use this method to send you notifications.',
    label: 'Select your preference',
    uid: 'radiogroup_hint',
  }),
];
