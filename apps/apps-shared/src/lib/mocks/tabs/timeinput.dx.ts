import { gui } from '@golemui/gui-shared';

export const timeInputTab = gui.layouts.flex([
  gui.inputs.timeInput('timeInputEmpty', {
    label: 'Empty',
    icon: 'schedule',
    minuteStep: 15,
  }),
  gui.inputs.timeInput('timeInputDefault', {
    label: 'With default value',
    defaultValue: '09:30:00',
    icon: 'schedule',
    minuteStep: 15,
  }),
  gui.inputs.timeInput('timeInputDisabled', {
    label: 'Disabled',
    defaultValue: '09:30:00',
    disabled: true,
    icon: 'schedule',
    minuteStep: 15,
  }),
  gui.inputs.timeInput('timeInputReadonly', {
    label: 'Read only',
    defaultValue: '09:30:00',
    readonly: true,
    icon: 'schedule',
    minuteStep: 15,
  }),
  gui.inputs.timeInput('timeInputValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'time',
    },
    minTime: '09:00:00',
    maxTime: '18:00:00',
    icon: 'schedule',
    minuteStep: 15,
  }),
]);
