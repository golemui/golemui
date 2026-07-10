import { gui } from '@golemui/gui-shared';

export const dateTimePickerTab = gui.layouts.flex([
  gui.inputs.dateTimePicker('dateTimePickerEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
    allowCustomTime: true,
  }),
  gui.inputs.dateTimePicker('dateTimePickerDefault', {
    label: 'With default value',
    defaultValue: '2026-02-13T09:30:00',
    icon: 'calendar_month',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimePicker('dateTimePickerDisabled', {
    label: 'Disabled',
    defaultValue: '2026-02-13T09:30:00',
    disabled: true,
    icon: 'calendar_month',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimePicker('dateTimePickerReadonly', {
    label: 'Read only',
    defaultValue: '2026-02-13T09:30:00',
    readonly: true,
    icon: 'calendar_month',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimePicker('dateTimePickerValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'date-time',
    },
    icon: 'calendar_month',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.dateTimePicker('dateTimePickerDisabledRanges', {
    label: 'Disabled date & time ranges',
    defaultValue: '2026-02-16T09:30:00',
    icon: 'calendar_month',
    allowCustomTime: true,
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
    minDate: '2026-02-01',
    maxDate: '2026-07-31',
    disabledRanges: [
      {
        start: '2026-02-09',
        end: '2026-02-10',
      },
      {
        start: '2026-02-17',
      },
    ],
    disabledTimeRanges: [
      {
        start: '13:00:00',
        end: '14:00:00',
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        start: '09:00:00',
        end: '10:30:00',
        date: '2026-02-13',
      },
    ],
  }),
]);
