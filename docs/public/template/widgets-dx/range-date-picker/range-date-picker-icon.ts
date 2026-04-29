import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDatePicker('dateRanges', {
    icon: 'calendar_month',
    label: 'Date Ranges',
  }),
];
