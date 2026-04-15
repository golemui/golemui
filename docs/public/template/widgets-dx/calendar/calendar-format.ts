import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'calendar',
      path: 'appointmentDate',
      props: {
        dayFormat: '2-digit',
        monthFormat: 'long',
        weekdayFormat: 'short',
      },
    },
  ],
});
