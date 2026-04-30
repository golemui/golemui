import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.calendar('appointmentDate', {
    minDate: '2024-01-05T00:00:00.000Z',
    maxDate: '2024-02-21T23:59:59.999Z',
    defaultValue: '2024-01-21T00:00:00.000Z',
  }),
];
