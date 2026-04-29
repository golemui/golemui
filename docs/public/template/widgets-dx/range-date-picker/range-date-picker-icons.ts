import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDatePicker('dateRanges', {
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    prevMonthAriaLabel: 'Go to previous month',
    nextMonthAriaLabel: 'Go to next month',
    label: 'Date Ranges',
  }),
];
