import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.currency('price_high', {
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
    label: 'High Precision (4-6 digits)',
    uid: 'currency-precision-high',
  }),
  gui.inputs.currency('price_low', {
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    label: 'No Decimals',
    uid: 'currency-precision-low',
  }),
];
