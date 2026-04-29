import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.currency('amount', {
    currency: 'USD',
    step: 5.5,
    label: 'Amount (Step 5.50)',
    uid: 'currency-step',
  }),
];
