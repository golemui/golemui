import { gui } from '@golemui/gui-shared';

export const rangeDateInputTab = gui.layouts.flex([
  gui.inputs.rangeDateInput('rangeDateInputEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
    separator: 'to',
  }),
  gui.inputs.rangeDateInput('rangeDateInputDefault', {
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
    icon: 'calendar_month',
    separator: 'to',
  }),
  gui.inputs.rangeDateInput('rangeDateInputDisabled', {
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
    icon: 'calendar_month',
    separator: 'to',
  }),
  gui.inputs.rangeDateInput('rangeDateInputReadonly', {
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
    icon: 'calendar_month',
    separator: 'to',
  }),
  gui.inputs.rangeDateInput('rangeDateInputValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
    icon: 'calendar_month',
    separator: 'to',
  }),
]);
