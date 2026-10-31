import { gui } from '@golemui/gui-shared';

export const passwordTab = gui.layouts.grid([
  gui.inputs.password('password', { label: 'Password', autocomplete: 'off' }),
  gui.inputs.password('passwordDisabled', {
    label: 'Disabled password',
    disabled: true,
    readonly: true,
  }),
  gui.inputs.password('passwordPhone', {
    label: 'Password with placeholder',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.password('passwordWithHint', {
    label: 'Password with hint',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.password('passwordWithIcon', {
    label: 'Password with icon',
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.password('passwordIconRight', {
    label: 'Password with custom icons',
    icon: 'lock',
    showPasswordIcon: 'visibility',
    hidePasswordIcon: 'visibility_off',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    validator: { required: true },
  }),
]);
