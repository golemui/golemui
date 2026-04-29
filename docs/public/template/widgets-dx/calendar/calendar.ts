import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.calendar('appointmentDate', {
    hint: 'Select a date',
    label: 'Calendar',
  }),
];
