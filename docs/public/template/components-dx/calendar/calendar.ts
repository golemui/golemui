import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'calendar',
      path: 'appointmentDate',
      label: 'Calendar',
      props: {
        hint: 'Select a date',
      },
    },
  ],
});
