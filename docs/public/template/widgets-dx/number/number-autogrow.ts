import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'number',
      path: 'amount',
      label: 'Amount',
      props: {
        autoGrow: true,
      },
    },
  ],
});
