import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeCalendar('vacationDates', {
    minDate: '2024-06-01T00:00:00.000Z',
    maxDate: '2024-08-31T23:59:59.999Z',
    defaultValue: [
      {
        start: '2024-06-21',
      },
    ],
  }),
];
