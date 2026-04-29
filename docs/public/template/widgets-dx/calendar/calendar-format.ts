import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.calendar('appointmentDate', {
    dayFormat: '2-digit',
    monthFormat: 'long',
    weekdayFormat: 'short',
  }),
];
