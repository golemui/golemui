import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'calendar',
      path: 'appointmentDate',
      props: {
        hint: 'Please select a valid date for your appointment',
      },
      label: 'Appointment Date',
    },
  ],
});
