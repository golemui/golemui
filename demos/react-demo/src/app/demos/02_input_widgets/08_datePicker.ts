import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const datePickerDemo: FormDemoDefinition = {
  title: '8. Date Picker',
  category: 'Ch2: Input Widgets',
  description:
    'A calendar-based date picker input. ' +
    'Supports hints, icons, and auto-generated labels from the field path.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.datePicker('birthDate', { hint: 'Select your date of birth' }),
    gui.inputs.datePicker('appointmentDate', { icon: 'calendar' }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
