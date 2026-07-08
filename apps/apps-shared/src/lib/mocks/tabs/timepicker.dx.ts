import { gui } from '@golemui/gui-shared';

export const timePickerTab = gui.layouts.flex([
  gui.inputs.timePicker('timePickerEmpty', {
    label: 'Empty',
    icon: 'schedule',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.timePicker('timePickerDefault', {
    label: 'With default value',
    defaultValue: '09:30:00',
    icon: 'schedule',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.timePicker('timePickerDisabled', {
    label: 'Disabled',
    defaultValue: '09:30:00',
    disabled: true,
    icon: 'schedule',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.timePicker('timePickerReadonly', {
    label: 'Read only',
    defaultValue: '09:30:00',
    readonly: true,
    icon: 'schedule',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
  gui.inputs.timePicker('timePickerValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'time',
    },
    icon: 'schedule',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 30,
  }),
]);
