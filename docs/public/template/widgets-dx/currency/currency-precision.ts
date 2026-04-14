import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'currency-precision-high',
      kind: 'input',
      type: 'currency',
      path: 'price_high',
      label: 'High Precision (4-6 digits)',
      props: {
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      },
    },
    {
      uid: 'currency-precision-low',
      kind: 'input',
      type: 'currency',
      path: 'price_low',
      label: 'No Decimals',
      props: {
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      },
    },
  ],
});
