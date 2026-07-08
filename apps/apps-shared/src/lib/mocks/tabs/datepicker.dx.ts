import { gui } from '@golemui/gui-shared';

export const datePickerTab = gui.layouts.flex([
  gui.inputs.datePicker('datePickerEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
  }),
  gui.inputs.datePicker('datePickerDefault', {
    label: 'With default value',
    defaultValue: '2026-02-13',
    icon: 'calendar_month',
  }),
  gui.inputs.datePicker('datePickerDisabled', {
    label: 'Disabled',
    defaultValue: '2026-02-13',
    disabled: true,
    icon: 'calendar_month',
  }),
  gui.inputs.datePicker('datePickerReadonly', {
    label: 'Read only',
    defaultValue: '2026-02-13',
    readonly: true,
    icon: 'calendar_month',
  }),
  gui.inputs.datePicker('datePickerValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'date',
    },
    icon: 'calendar_month',
  }),
  gui.inputs.datePicker('datePickerDisabledRanges', {
    label: 'Disabled date ranges',
    defaultValue: '2026-02-13',
    icon: 'calendar_month',
    disabledRanges: [
      {
        start: '2026-02-09',
        end: '2026-02-10',
      },
      {
        start: '2026-02-17',
      },
    ],
  }),
]);
