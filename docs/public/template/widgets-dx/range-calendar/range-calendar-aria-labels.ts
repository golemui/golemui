import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeCalendar('dates', {
    prevMonthAriaLabel: 'Go to previous month',
    nextMonthAriaLabel: 'Go to next month',
    removePillAriaLabel: 'Remove date range',
    label: 'Range Calendar with Aria Labels',
    uid: 'range-calendar-aria-labels',
  }),
];
