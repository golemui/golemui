import { gui } from '@golemui/gui-shared';

export const calendarTab = gui.layouts.flex([
  gui.displays.custom('heading', { text: 'RANGE DATE INPUTS', level: 3 }),

  gui.inputs.rangeDateInput('rangeDateInput', {
    defaultValue: [
      { start: '2026-02-13', end: '2026-02-16' },
      { start: '2026-02-20' },
      { start: '2026-02-07', end: '2026-02-16' },
      { start: '2026-07-20', end: '2026-07-26' },
      { start: '2024-12-02', end: '2024-12-06' },
      { start: '2023-02-20' },
    ],
    removePillAriaLabel: 'Delete holiday period',
    startDateAriaLabel: 'Begin of holiday period',
    endDateAriaLabel: 'End of holiday period',
    separator: 'to',
    icon: 'calendar_month',
  }),

  gui.inputs.rangeDatePicker('rangeDatePicker', {
    defaultValue: [
      { start: '2026-02-13', end: '2026-02-16' },
      { start: '2026-02-20' },
      { start: '2026-07-20', end: '2026-07-26' },
      { start: '2024-12-02', end: '2024-12-06' },
    ],
    numberOfMonths: 1,
    icon: 'calendar_month',
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    prevMonthAriaLabel: 'Go To Previous Month',
    nextMonthAriaLabel: 'Go To Next Month',
    disabledRanges: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
    removePillAriaLabel: 'Delete holiday period',
    startDateAriaLabel: 'Begin of holiday period',
    endDateAriaLabel: 'End of holiday period',
    separator: 'to',
    validator: { required: true },
  }),

  gui.inputs.rangeCalendar('rangeCalendar', {
    defaultValue: [{ start: '2026-02-13', end: '2026-02-16' }, { start: '2026-02-20' }],
    numberOfMonths: 3,
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    removePillAriaLabel: 'Delete holiday period',
    prevMonthAriaLabel: 'Go To Previous Month',
    nextMonthAriaLabel: 'Go To Next Month',
    disabledRanges: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
  }),

  gui.displays.custom('heading', { text: 'DATE INPUTS', level: 3 }),

  gui.inputs.dateInput('dateInput', {
    icon: 'calendar_month',
    validator: { required: true, format: 'date' },
  }),

  gui.inputs.datePicker('datePicker', {
    icon: 'calendar_month',
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    prevMonthAriaLabel: 'Go To Previous Month',
    nextMonthAriaLabel: 'Go To Next Month',
    validator: { required: true, format: 'date' },
  }),

  gui.inputs.calendar('calendar', {
    defaultValue: '2026-02-13',
    prevMonthAriaLabel: 'Go To Previous Month',
    nextMonthAriaLabel: 'Go To Next Month',
    minDate: '2022-01-01',
    maxDate: '2026-03-28',
    disabledRanges: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
    validator: { required: true, format: 'date' },
  }),

  gui.displays.custom('heading', { text: 'TIME INPUTS', level: 3 }),

  gui.inputs.timeInput('timeInput', {
    label: '12h time format',
    hint: '15m step jumps on minutes',
    defaultValue: '09:30:00',
    icon: 'schedule',
    minuteStep: 15,
    validator: { required: true, format: 'time' },
  }),

  gui.inputs.timeInput('timeInput24', {
    label: '24h time format',
    hourFormat: '24',
    validator: { required: true, format: 'time' },
  }),

  gui.displays.custom('heading', { text: 'TIME PICKERS', level: 3 }),

  gui.inputs.timePicker('timePicker', {
    label: 'Pick a time slot',
    hint: '30m slots from 9:00 to 18:00, lunch break disabled',
    disabledRangeMessage: 'Lunch break is not available',
    noAvailableTimesMessage: 'No time slots available',
    maxTimeMessage: 'Office closed from 18:00',
    minTimeMessage: 'Office not open until 9:00',
    defaultValue: '09:30:00',
    allowCustomTime: true,
    icon: 'schedule',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
    hourFormat: '24',
    disabledRanges: [{ start: '13:00:00', end: '14:00:00' }],
    validator: { required: true, format: 'time' },
  }),

  gui.inputs.timePicker('timePickerFree', {
    label: 'Custom time allowed',
    hint: 'Type any time or pick a 15m slot',
    allowCustomTime: true,
    minTime: '08:00:00',
    maxTime: '20:00:00',
    minuteStep: 15,
    validator: { format: 'time' },
  }),

  gui.inputs.timePicker('timePicker24', {
    label: '24h time picker',
    hourFormat: '24',
    validator: { format: 'time' },
  }),

  gui.displays.custom('heading', { text: 'DATE TIME INPUTS', level: 3 }),

  gui.inputs.dateTimeInput('dateTimeInput', {
    label: '12h date time format',
    hint: '15m step jumps on minutes',
    defaultValue: '2026-07-03T09:30:00',
    icon: 'calendar_month',
    minuteStep: 15,
    validator: { required: true, format: 'date-time' },
  }),

  gui.inputs.dateTimeInput('dateTimeInput24', {
    label: '24h date time format',
    hourFormat: '24',
    validator: { required: true, format: 'date-time' },
  }),

  gui.displays.custom('heading', { text: 'DATE TIME CALENDARS', level: 3 }),

  gui.inputs.dateTimeCalendar('dateTimeCalendar', {
    label: 'Book an appointment',
    hint: '30m slots from 9:00 to 18:00, weekday lunch break disabled',
    minDate: '2026-02-01',
    maxDate: '2026-07-31',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
    allowCustomTime: true,
    disabledTimeRanges: [
      { start: '13:00:00', end: '14:00:00', weekdays: [1, 2, 3, 4, 5] },
      { start: '09:00:00', end: '10:30:00', date: '2026-02-13' },
    ],
    disabledRanges: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
    validator: { required: true, format: 'date-time' },
  }),

  gui.inputs.dateTimeCalendar('dateTimeCalendarPrefilled', {
    label: 'Prefilled slot',
    defaultValue: '2026-02-13T11:00:00',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    hourFormat: '24',
    validator: { format: 'date-time' },
  }),
]);
