import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.textInput('user.password', {
    validator: {
      type: 'string',
      required: true,
      minLength: 8,
      maxLength: 20,
      pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$',
    },
    uid: 'userPasswordInput',
  }),
];
