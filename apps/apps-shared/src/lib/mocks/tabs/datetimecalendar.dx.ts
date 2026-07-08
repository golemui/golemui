import { gui } from '@golemui/gui-shared';

export const dateTimeCalendarTab = gui.layouts.flex([
  gui.inputs.dateTimeCalendar('dateTimeCalendarEmpty', {
    label: 'Empty',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimeCalendar('dateTimeCalendarDefault', {
    label: 'With default value',
    defaultValue: '2026-02-13T09:30:00',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimeCalendar('dateTimeCalendarDisabled', {
    label: 'Disabled',
    defaultValue: '2026-02-13T09:30:00',
    disabled: true,
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimeCalendar('dateTimeCalendarReadonly', {
    label: 'Read only',
    defaultValue: '2026-02-13T09:30:00',
    readonly: true,
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimeCalendar('dateTimeCalendarValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'date-time',
    },
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
]);
