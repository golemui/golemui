import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.calendar('appointmentDate', {
    disabledRanges: [
      {
        start: '2024-03-10T00:00:00.000Z',
        end: '2024-03-15T23:59:59.999Z',
      },
    ],
  }),
];
