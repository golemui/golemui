import { gui } from '@golemui/gui-shared';

export const rangeCalendarTab = gui.layouts.flex([
  gui.inputs.rangeCalendar('rangeCalendarEmpty', {
    label: 'Empty',
  }),
  gui.inputs.rangeCalendar('rangeCalendarDefault', {
    label: 'With default value',
    defaultValue: [
      {
        start: '2026-02-13',
        end: '2026-02-16',
      },
      {
        start: '2026-02-20',
      },
    ],
  }),
  gui.inputs.rangeCalendar('rangeCalendarDisabled', {
    label: 'Disabled',
    defaultValue: [
      {
        start: '2026-02-13',
        end: '2026-02-16',
      },
      {
        start: '2026-02-20',
      },
    ],
    disabled: true,
  }),
  gui.inputs.rangeCalendar('rangeCalendarReadonly', {
    label: 'Read only',
    defaultValue: [
      {
        start: '2026-02-13',
        end: '2026-02-16',
      },
      {
        start: '2026-02-20',
      },
    ],
    readonly: true,
  }),
  gui.inputs.rangeCalendar('rangeCalendarValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
  }),
  gui.inputs.rangeCalendar('rangeCalendarDisabledRanges', {
    label: 'Disabled date ranges',
    defaultValue: [
      {
        start: '2026-02-13',
        end: '2026-02-16',
      },
      {
        start: '2026-02-20',
      },
    ],
    disabledRanges: [
      {
        start: '2026-02-09',
        end: '2026-02-10',
      },
      {
        start: '2026-02-17',
      },
    ],
  }),
]);
