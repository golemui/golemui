import { gui } from '@golemui/gui-shared';

export const rangeDateTimeInputTab = gui.layouts.flex([
  gui.inputs.rangeDateTimeInput('rangeDateTimeInputEmpty', {
    label: 'Empty',
    separator: 'to',
  }),
  gui.inputs.rangeDateTimeInput('rangeDateTimeInputDefault', {
    label: 'With default value',
    defaultValue: [
      {
        start: '2026-11-22T09:00:00',
        end: '2026-11-22T11:00:00',
      },
      {
        start: '2026-11-23T14:00:00',
        end: '2026-11-24T09:30:00',
      },
    ],
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeDateTimeInput('rangeDateTimeInputConstraints', {
    label: 'With min/max date and time',
    minDate: '2026-01-01',
    maxDate: '2026-12-31',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 15,
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeDateTimeInput('rangeDateTimeInputDisabled', {
    label: 'Disabled',
    defaultValue: [
      {
        start: '2026-11-22T09:00:00',
        end: '2026-11-22T11:00:00',
      },
    ],
    disabled: true,
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeDateTimeInput('rangeDateTimeInputReadonly', {
    label: 'Read only',
    defaultValue: [
      {
        start: '2026-11-22T09:00:00',
        end: '2026-11-22T11:00:00',
      },
    ],
    readonly: true,
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeDateTimeInput('rangeDateTimeInputValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
    icon: 'schedule',
    separator: 'to',
  }),
]);
