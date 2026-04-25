import { gui } from '@golemui/gui-shared';

export const passwordTab = gui.layouts.flex([
  gui.inputs.password('password', { autocomplete: 'off' }),
  gui.inputs.password('passwordDisabled', { disabled: true, readonly: true }),
  gui.inputs.password('passwordPhone', { placeholder: 'Please enter your phone number' }),
  gui.inputs.password('passwordWithHint', {
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.password('passwordWithIcon', {
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
  }),
  gui.inputs.password('passwordIconRight', {
    icon: 'lock',
    showPasswordIcon: 'visibility',
    hidePasswordIcon: 'visibility_off',
    hint: 'This is a hint',
    placeholder: 'Please enter your phone number',
    // TODO: validator on password — DX type gap, tracked in dx-open-items
  }),
]);
