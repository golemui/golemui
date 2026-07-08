import { gui } from '@golemui/gui-shared';

export const dateTimePickerTab = gui.layouts.flex([
  gui.inputs.dateTimePicker('dateTimePickerEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
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
]);
