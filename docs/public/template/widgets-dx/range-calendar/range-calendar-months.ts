import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'rangeCalendar',
      path: 'vacationDates',
      props: {
        numberOfMonths: 2,
      },
    },
  ],
});
