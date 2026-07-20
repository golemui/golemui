import { gui } from '@golemui/gui-shared';

export const rangeDateTimeCalendarTab = gui.layouts.flex([
  gui.inputs.rangeDateTimeCalendar('rangeDateTimeCalendarEmpty', {
    label: 'Empty',
    minuteStep: 30,
    startTimeLabel: 'Check-in',
    endTimeLabel: 'Check-out',
  }),
  gui.inputs.rangeDateTimeCalendar('rangeDateTimeCalendarDefault', {
    label: 'With default value',
    dayCountAriaLabel: 'Number of slots taken: {count}',
    defaultValue: [
      {
        start: '2026-02-13T09:00:00',
        end: '2026-02-13T11:00:00',
      },
      {
        start: '2026-02-13T13:00:00',
        end: '2026-02-13T15:00:00',
      },
      {
        start: '2026-02-16T14:00:00',
        end: '2026-02-18T09:30:00',
      },
    ],
    minuteStep: 30,
  }),
  gui.inputs.rangeDateTimeCalendar('rangeDateTimeCalendarDisabled', {
    label: 'Disabled',
    defaultValue: [
      {
        start: '2026-02-13T09:00:00',
        end: '2026-02-13T11:00:00',
      },
    ],
    disabled: true,
    minuteStep: 30,
  }),
  gui.inputs.rangeDateTimeCalendar('rangeDateTimeCalendarReadonly', {
    label: 'Read only',
    defaultValue: [
      {
        start: '2026-02-13T09:00:00',
        end: '2026-02-13T11:00:00',
      },
    ],
    readonly: true,
    minuteStep: 30,
  }),
  gui.inputs.rangeDateTimeCalendar('rangeDateTimeCalendarValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
    minuteStep: 30,
  }),
  gui.inputs.rangeDateTimeCalendar('rangeDateTimeCalendarConstraints', {
    label: 'With min/max date-time and disabled spans',
    minuteStep: 30,
    minDateTime: '2026-02-01T09:00:00',
    maxDateTime: '2026-07-31T18:00:00',
    allowCustomTime: true,
    disabledRanges: [
      {
        start: '2026-02-09T00:00:00',
        end: '2026-02-10T23:59:59',
      },
      {
        start: '2026-02-17T13:00:00',
        end: '2026-02-17T14:00:00',
      },
    ],
  }),
]);
