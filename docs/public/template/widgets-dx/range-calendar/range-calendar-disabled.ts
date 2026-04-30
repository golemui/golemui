import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeCalendar('vacationDates', {
    disabledRanges: [
      {
        start: '2024-07-04T00:00:00.000Z',
        end: '2024-07-07T23:59:59.999Z',
      },
    ],
    defaultValue: [
      {
        start: '2024-07-21',
        end: '2024-07-25',
      },
    ],
  }),
];
