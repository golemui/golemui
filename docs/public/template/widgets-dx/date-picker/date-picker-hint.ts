import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'datePicker',
      path: 'startDate',
      label: 'Start Date',
      props: {
        hint: 'Provide a start date to calculate your quote.',
      },
    },
  ],
});
