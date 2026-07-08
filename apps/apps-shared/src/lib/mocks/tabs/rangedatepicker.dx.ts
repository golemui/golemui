import { gui } from '@golemui/gui-shared';

export const rangeDatePickerTab = gui.layouts.flex([
  gui.inputs.rangeDatePicker('rangeDatePickerEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
    separator: 'to',
  }),
  gui.inputs.rangeDatePicker('rangeDatePickerDefault', {
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
  gui.inputs.rangeDatePicker('rangeDatePickerDisabled', {
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
  gui.inputs.rangeDatePicker('rangeDatePickerReadonly', {
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
  gui.inputs.rangeDatePicker('rangeDatePickerValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
    },
    icon: 'calendar_month',
    separator: 'to',
  }),
]);
