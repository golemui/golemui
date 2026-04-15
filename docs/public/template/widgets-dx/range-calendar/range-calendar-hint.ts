import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'rangeCalendar',
      path: 'vacationDates',
      props: {
        hint: 'Please select the start and end dates for your vacation',
      },
      label: 'Vacation Dates',
    },
  ],
});
