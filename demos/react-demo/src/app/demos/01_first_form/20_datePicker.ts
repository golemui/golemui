import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiDatePicker, _guiInputs, _gslRoot } from '@golemui/gui-shared';

export const datePickerDemo: FormDemoDefinition = {
  title: '20. Date Picker',
  category: 'Ch1: First Form',
  description:
    'A calendar-based date picker input. '
    + 'Supports hints, icons, and auto-generated labels from the field path.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiDatePicker('birthDate', { hint: 'Select your date of birth' }),
    _guiDatePicker('appointmentDate', { icon: 'calendar' }),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
