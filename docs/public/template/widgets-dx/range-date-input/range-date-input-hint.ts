import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDateInput('dateRanges', {
    hint: 'Enter one or more date ranges',
    label: 'Date Ranges',
  }),
];
