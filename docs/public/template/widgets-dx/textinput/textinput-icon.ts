import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textInput('phoneNumber', {
    icon: 'phone_callback',
    label: 'Phone Number',
  }),
  gui.inputs.textInput('email', {
    icon: 'alternate_email',
    label: 'Email',
  }),
];
