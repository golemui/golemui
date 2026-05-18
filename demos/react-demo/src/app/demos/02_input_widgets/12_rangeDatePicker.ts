import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const rangeDatePickerDemo: FormDemoDefinition = {
  title: '12. Range Date Picker',
  category: 'Ch2: Input Widgets',
  description:
    'A calendar-based date range picker. ' +
    'Supports multi-month display, date constraints, and auto-generated labels from the field path.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.rangeDatePicker('bookingRange', { hint: 'Select your booking dates' }),
    gui.inputs.rangeDatePicker('availability', {
      numberOfMonths: 2,
      minDate: '2026-01-01',
      maxDate: '2026-12-31',
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
