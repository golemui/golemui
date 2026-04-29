import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.password('password', {
    hint: 'Must be at least 8 characters long.',
    label: 'Password',
  }),
];
