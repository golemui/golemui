import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.rangeCalendar('vacationDates', {
    hint: 'Please select the start and end dates for your vacation',
    label: 'Vacation Dates',
  }),
];
