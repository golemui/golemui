import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'calendar-icons',
      kind: 'input',
      type: 'calendar',
      path: 'date',
      label: 'Custom Icons Calendar',
      props: {
        prevMonthIcon: 'chevron_left',
        nextMonthIcon: 'chevron_right',
        prevMonthAriaLabel: 'Go to previous month',
        nextMonthAriaLabel: 'Go to next month',
      },
    },
  ],
});
