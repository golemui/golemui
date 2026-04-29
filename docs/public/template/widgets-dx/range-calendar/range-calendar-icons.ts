import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeCalendar('dates', {
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    prevMonthAriaLabel: 'Go to previous month',
    nextMonthAriaLabel: 'Go to next month',
    label: 'Custom Icons Range Calendar',
    uid: 'range-calendar-icons',
  }),
];
