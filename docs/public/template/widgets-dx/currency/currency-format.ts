import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.currency('price', {
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
    label: 'Price (EUR)',
  }),
];
