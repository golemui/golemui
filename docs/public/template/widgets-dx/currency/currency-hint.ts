import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.currency('price', {
    hint: 'Please enter the price in USD.',
    label: 'Price',
  }),
];
