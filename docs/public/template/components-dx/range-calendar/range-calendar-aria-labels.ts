import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'range-calendar-aria-labels',
      kind: 'input',
      type: 'rangeCalendar',
      path: 'dates',
      label: 'Range Calendar with Aria Labels',
      props: {
        prevMonthAriaLabel: 'Go to previous month',
        nextMonthAriaLabel: 'Go to next month',
        removePillAriaLabel: 'Remove date range',
      },
    },
  ],
});
