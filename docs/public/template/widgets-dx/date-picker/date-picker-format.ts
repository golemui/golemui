import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.datePicker('startDate', {
    dayFormat: '2-digit',
    monthFormat: 'long',
    weekdayFormat: 'narrow',
    label: 'Start Date',
  }),
];
