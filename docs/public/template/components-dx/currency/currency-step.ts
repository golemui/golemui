import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'currency-step',
      kind: 'input',
      type: 'currency',
      path: 'amount',
      label: 'Amount (Step 5.50)',
      props: {
        currency: 'USD',
        step: 5.5,
      },
    },
  ],
});
