import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'range-calendar-icons',
      kind: 'input',
      type: 'rangeCalendar',
      path: 'dates',
      label: 'Custom Icons Range Calendar',
      props: {
        prevMonthIcon: 'chevron_left',
        nextMonthIcon: 'chevron_right',
        prevMonthAriaLabel: 'Go to previous month',
        nextMonthAriaLabel: 'Go to next month',
      },
    },
  ],
});
