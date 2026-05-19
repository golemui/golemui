import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textInput('user.password', {
    label: 'Password',
    validator: {
      required: true,
      minLength: 8,
      maxLength: 20,
      pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$',
      messages: {
        required: 'Please enter your password',
        minLength: 'Password must be at least 8 characters',
        maxLength: 'Password cannot exceed 20 characters',
        pattern: 'Password must contain both letters and numbers',
      },
    },
    uid: 'userPasswordInput',
  }),
];
