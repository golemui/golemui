import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'select',
      path: 'country',
      label: 'Country',
      props: {
        placeholder: 'Select your country',
        options: [
          {
            label: 'United States',
            value: 'us',
          },
          {
            label: 'Canada',
            value: 'ca',
          },
        ],
      },
    },
  ],
});
