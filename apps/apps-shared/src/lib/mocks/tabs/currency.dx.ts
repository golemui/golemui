import { gui } from '@golemui/gui-shared';

export const currencyTab = gui.layouts.flex([
  gui.inputs.currency('currency', { autocomplete: 'off' }),
  gui.inputs.currency('currencyDisabled', { disabled: true, readonly: true }),
  gui.inputs.currency('currencyMaximumFractionDigits', {
    placeholder: 'maximum 2 digits after the decimal point',
    maximumFractionDigits: 2,
  }),
  gui.inputs.currency('currencyMinimumFractionDigits', {
    placeholder: 'minimum 4 digits after the decimal point',
    minimumFractionDigits: 4,
  }),
  gui.inputs.currency('currencyWithIcon', {
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter price in USD',
  }),
  gui.inputs.currency('currencyIconRightWithEUR', {
    currency: 'EUR',
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter price in EUR',
    // TODO: validator on currency — DX type gap, tracked in dx-open-items
  }),
]);
