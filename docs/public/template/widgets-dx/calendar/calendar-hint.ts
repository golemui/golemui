import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.calendar('appointmentDate', {
    hint: 'Please select a valid date for your appointment',
    label: 'Appointment Date',
  }),
];
