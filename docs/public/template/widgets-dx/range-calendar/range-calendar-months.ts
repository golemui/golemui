import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeCalendar('vacationDates', {
    numberOfMonths: 2,
  }),
];
