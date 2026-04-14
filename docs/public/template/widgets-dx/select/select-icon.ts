import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'select',
      path: 'country',
      label: 'Country',
      props: {
        icon: 'fas fa-globe',
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
