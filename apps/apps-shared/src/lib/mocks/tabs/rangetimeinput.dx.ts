import { gui } from '@golemui/gui-shared';

export const rangeTimeInputTab = gui.layouts.flex([
  gui.inputs.rangeTimeInput('rangeTimeInputEmpty', {
    label: 'Empty',
    icon: 'schedule',
    separator: 'to',
    hourFormat: '24',
  }),
  gui.inputs.rangeTimeInput('rangeTimeInputDefault', {
    label: 'With default value',
    defaultValue: [
      {
        start: '09:00:00',
        end: '11:00:00',
      },
      {
        start: '14:00:00',
        end: '14:30:00',
      },
    ],
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeTimeInput('rangeTimeInputConstraints', {
    label: 'With min/max time',
    minTime: '09:00:00',
    maxTime: '18:00:00',
    minuteStep: 15,
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeTimeInput('rangeTimeInputDisabled', {
    label: 'Disabled',
    defaultValue: [
      {
        start: '09:00:00',
        end: '11:00:00',
      },
      {
        start: '14:00:00',
        end: '14:30:00',
      },
    ],
    disabled: true,
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeTimeInput('rangeTimeInputReadonly', {
    label: 'Read only',
    defaultValue: [
      {
        start: '09:00:00',
        end: '11:00:00',
      },
      {
        start: '14:00:00',
        end: '14:30:00',
      },
    ],
    readonly: true,
    icon: 'schedule',
    separator: 'to',
  }),
  gui.inputs.rangeTimeInput('rangeTimeInputValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
    icon: 'schedule',
    separator: 'to',
  }),
]);
