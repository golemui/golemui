import { gui } from '@golemui/gui-shared';

export const currencyTab = gui.layouts.grid([
  gui.inputs.currency('currency', { label: 'Currency', autocomplete: 'off' }),
  gui.inputs.currency('currencyDisabled', {
    label: 'Disabled currency',
    disabled: true,
    readonly: true,
  }),
  gui.inputs.currency('currencyMaximumFractionDigits', {
    label: 'Currency with maximum fraction digits',
    placeholder: 'maximum 2 digits after the decimal point',
    maximumFractionDigits: 2,
  }),
  gui.inputs.currency('currencyMinimumFractionDigits', {
    label: 'Currency with minimum fraction digits',
    placeholder: 'minimum 4 digits after the decimal point',
    minimumFractionDigits: 4,
  }),
  gui.inputs.currency('currencyWithIcon', {
    label: 'Currency with icon',
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter price in USD',
  }),
  gui.inputs.currency('currencyIconRightWithEUR', {
    label: 'Currency in EUR',
    currency: 'EUR',
    icon: 'phone_callback',
    hint: 'This is a hint',
    placeholder: 'Please enter price in EUR',
    validator: { required: true, minimum: 100 },
  }),
]);
