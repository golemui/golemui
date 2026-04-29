import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDatePicker('dateRanges', {
    hint: 'Select one or more date ranges from the calendar.',
    label: 'Date Ranges',
  }),
];
