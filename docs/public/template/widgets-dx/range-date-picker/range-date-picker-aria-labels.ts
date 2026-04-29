import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeDatePicker('dateRanges', {
    removePillAriaLabel: 'Delete range',
    startDateAriaLabel: 'From date',
    endDateAriaLabel: 'To date',
    label: 'Date Ranges',
  }),
];
