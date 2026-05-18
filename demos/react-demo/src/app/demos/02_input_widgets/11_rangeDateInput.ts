import { type FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const rangeDateInputDemo: FormDemoDefinition = {
  title: '11. Range Date Input',
  category: 'Ch2: Input Widgets',
  description:
    'A date range input with start and end fields. ' +
    'Supports hints, icons, custom separators, and auto-generated labels from the field path.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.rangeDateInput('travelDates', { hint: 'Select your travel dates' }),
    gui.inputs.rangeDateInput('projectTimeline', { separator: '→', icon: 'calendar' }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
