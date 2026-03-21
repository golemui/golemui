import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiRangeDatePicker, _guiInputs } from '@golemui/gui-shared';

export const rangeDatePickerDemo: FormDemoDefinition = {
  title: '12. Range Date Picker',
  category: 'Ch2: Input Widgets',
  description:
    'A calendar-based date range picker. '
    + 'Supports multi-month display, date constraints, and auto-generated labels from the field path.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiRangeDatePicker('bookingRange', { hint: 'Select your booking dates' }),
    _guiRangeDatePicker('availability', { numberOfMonths: 2, minDate: '2026-01-01', maxDate: '2026-12-31' }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
