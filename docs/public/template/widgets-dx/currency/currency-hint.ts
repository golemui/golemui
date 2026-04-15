import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'currency',
      path: 'price',
      label: 'Price',
      props: {
        hint: 'Please enter the price in USD.',
      },
    },
  ],
});
