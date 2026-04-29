import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDateInput('dateRanges', {
    separator: 'to',
    label: 'Date Ranges',
  }),
];
