import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.password('password', {
    showPasswordLabel: 'Reveal',
    hidePasswordLabel: 'Mask',
    label: 'Password',
  }),
];
