import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'datePicker',
      path: 'startDate',
      label: 'Start Date',
      props: {
        dayFormat: '2-digit',
        monthFormat: 'long',
        weekdayFormat: 'narrow',
      },
    },
  ],
});
