import { gui } from '@golemui/gui-shared';

export const numberTab = gui.layouts.flex([
  gui.inputs.numberInput('number', {
    label: 'Temperature',
    hint: 'This is a hint',
    placeholder: 'ºC',
    minimum: -45,
    maximum: 42,
    step: 0.5,
    autoGrow: true,
    autocomplete: 'off',
    validator: { minimum: -45, maximum: 42, required: true },
  }),
  gui.inputs.numberInput('numberDisabled', { disabled: true, readonly: true }),
  gui.inputs.numberInput('percentage', { placeholder: '%' }),
  gui.inputs.numberInput('percentageWithHint', {
    label: 'Percentage',
    hint: 'This is a hint',
    placeholder: '%',
  }),
  gui.inputs.numberInput('numberIcon', { hint: 'This is a hint', placeholder: 'ms' }),
  gui.inputs.numberInput('numberIconRight', { hint: 'This is a hint', placeholder: 'Inch' }),
  gui.inputs.numberInput('height', {
    label: 'Height',
    hint: 'In meters',
    step: 0.01,
    validator: { minimum: 0, maximum: 2.5, required: true },
  }),
]);
