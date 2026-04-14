import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'select',
      path: 'country',
      label: 'Country',
      props: {
        labelField: 'name',
        valueField: 'code',
        options: [
          {
            name: 'United States',
            code: 'us',
          },
          {
            name: 'Canada',
            code: 'ca',
          },
        ],
      },
    },
  ],
});
