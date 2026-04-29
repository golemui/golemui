import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDateInput('dateRanges', {
    icon: 'calendar_month',
    label: 'Date Ranges',
  }),
];
