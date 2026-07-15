import { gui } from '@golemui/gui-shared';

export const rangeDatePickerTab = gui.layouts.flex([
  gui.inputs.rangeDatePicker('rangeDatePickerEmpty', {
    label: 'Empty',
    icon: 'calendar_month',
    separator: 'to',
  }),
  gui.inputs.rangeDatePicker('rangeDatePickerMinMax', {
    label: 'Min/Max',
    icon: 'calendar_month',
    separator: 'to',
    defaultValue: [{ start: '2026-02-20', }],
    minDate: '2026-02-01',
    maxDate: '2026-02-28',
    minDateMessage: 'Min date is 01.02.2026',
    maxDateMessage: 'Max date is 28.02.2026',
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
  gui.inputs.rangeDatePicker('rangeDatePickerDisabledRanges', {
    label: 'Disabled date ranges',
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
