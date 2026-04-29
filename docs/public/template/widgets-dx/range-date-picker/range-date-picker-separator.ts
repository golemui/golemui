import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDatePicker('dateRanges', {
    separator: 'to',
    label: 'Date Ranges',
  }),
];
