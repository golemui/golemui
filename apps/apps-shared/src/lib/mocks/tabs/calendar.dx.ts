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
    prevMonthIcon: 'chevron_left',
    nextMonthIcon: 'chevron_right',
    prevMonthAriaLabel: 'Go To Previous Month',
    nextMonthAriaLabel: 'Go To Next Month',
    minDate: '2022-01-01',
    maxDate: '2026-03-28',
    disabledRanges: [{ start: '2026-02-09', end: '2026-02-10' }, { start: '2026-02-17' }],
    validator: { required: true, format: 'date' },
  }),
]);
