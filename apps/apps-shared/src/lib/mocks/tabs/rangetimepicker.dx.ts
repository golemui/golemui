import { gui } from '@golemui/gui-shared';

export const rangeTimePickerTab = gui.layouts.flex([
  gui.inputs.rangeTimePicker('rangeTimePickerEmpty', {
    label: 'Empty',
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
    minTime: '06:00:00',
    maxTime: '22:00:00',
    minuteStep: 30,
    allowCustomTime: true,
  }),
  gui.inputs.rangeTimePicker('rangeTimePickerDefault', {
    label: 'Shift schedule',
    defaultValue: [
      {
        start: '09:00:00',
        end: '12:00:00',
      },
      {
        start: '14:00:00',
        end: '17:00:00',
      },
    ],
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
    minTime: '06:00:00',
    maxTime: '22:00:00',
    minuteStep: 30,
  }),
  gui.inputs.rangeTimePicker('rangeTimePickerConstraints', {
    label: 'Booking with lunch break',
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 15,
    allowCustomTime: true,
    disabledRanges: [
      {
        start: '13:00:00',
        end: '14:00:00',
      },
    ],
  }),
  gui.inputs.rangeTimePicker('rangeTimePickerDisabled', {
    label: 'Disabled',
    defaultValue: [
      {
        start: '09:00:00',
        end: '12:00:00',
      },
      {
        start: '14:00:00',
        end: '17:00:00',
      },
    ],
    disabled: true,
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
    minTime: '06:00:00',
    maxTime: '22:00:00',
    minuteStep: 30,
  }),
  gui.inputs.rangeTimePicker('rangeTimePickerReadonly', {
    label: 'Read only',
    defaultValue: [
      {
        start: '09:00:00',
        end: '12:00:00',
      },
      {
        start: '14:00:00',
        end: '17:00:00',
      },
    ],
    readonly: true,
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
    minTime: '06:00:00',
    maxTime: '22:00:00',
    minuteStep: 30,
  }),
  gui.inputs.rangeTimePicker('rangeTimePickerValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
    minTime: '06:00:00',
    maxTime: '22:00:00',
    minuteStep: 30,
  }),
]);
