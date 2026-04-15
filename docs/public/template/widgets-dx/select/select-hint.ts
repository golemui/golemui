import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'select',
      path: 'country',
      label: 'Country',
      props: {
        hint: 'Please select your current country of residence.',
        options: [
          {
            label: 'United States',
            value: 'us',
          },
        ],
      },
    },
  ],
});
