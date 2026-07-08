import { gui } from '@golemui/gui-shared';

export const calendarTab = gui.layouts.flex([
  gui.inputs.calendar('calendarEmpty', {
    label: 'Empty',
  }),
  gui.inputs.calendar('calendarDefault', {
    label: 'With default value',
    defaultValue: '2026-02-13',
  }),
  gui.inputs.calendar('calendarDisabled', {
    label: 'Disabled',
    defaultValue: '2026-02-13',
    disabled: true,
  }),
  gui.inputs.calendar('calendarReadonly', {
    label: 'Read only',
    defaultValue: '2026-02-13',
    readonly: true,
  }),
  gui.inputs.calendar('calendarValidation', {
    label: 'Required (validation)',
    validator: {
      required: true,
      format: 'date',
    },
  }),
  gui.inputs.calendar('calendarDisabledRanges', {
    label: 'Disabled date ranges',
    defaultValue: '2026-02-13',
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
