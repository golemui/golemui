import { gui } from '@golemui/gui-shared';

export const dateInputTab = gui.layouts.flex([
  gui.inputs.dateInput('dateInputEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
  }),
  gui.inputs.dateInput('dateInputDefault', {
    label: 'With default value',
    defaultValue: '2026-02-13',
    icon: 'calendar_month',
  }),
  gui.inputs.dateInput('dateInputDisabled', {
    label: 'Disabled',
    defaultValue: '2026-02-13',
    disabled: true,
    icon: 'calendar_month',
  }),
  gui.inputs.dateInput('dateInputReadonly', {
    label: 'Read only',
    defaultValue: '2026-02-13',
    readonly: true,
    icon: 'calendar_month',
  }),
  gui.inputs.dateInput('dateInputValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'date',
    },
    icon: 'calendar_month',
  }),
]);
