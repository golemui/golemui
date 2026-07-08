import { gui } from '@golemui/gui-shared';

export const dateTimeInputTab = gui.layouts.flex([
  gui.inputs.dateTimeInput('dateTimeInputEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
    minuteStep: 15,
  }),
  gui.inputs.dateTimeInput('dateTimeInputDefault', {
    label: 'With default value',
    defaultValue: '2026-02-13T09:30:00',
    icon: 'calendar_month',
    minuteStep: 15,
  }),
  gui.inputs.dateTimeInput('dateTimeInputDisabled', {
    label: 'Disabled',
    defaultValue: '2026-02-13T09:30:00',
    disabled: true,
    icon: 'calendar_month',
    minuteStep: 15,
  }),
  gui.inputs.dateTimeInput('dateTimeInputReadonly', {
    label: 'Read only',
    defaultValue: '2026-02-13T09:30:00',
    readonly: true,
    icon: 'calendar_month',
    minuteStep: 15,
  }),
  gui.inputs.dateTimeInput('dateTimeInputValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'date-time',
    },
    icon: 'calendar_month',
    minuteStep: 15,
  }),
]);
