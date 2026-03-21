import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiRangeDateInput, _guiInputs } from '@golemui/gui-shared';

export const rangeDateInputDemo: FormDemoDefinition = {
  title: '11. Range Date Input',
  category: 'Ch2: Input Widgets',
  description:
    'A date range input with start and end fields. '
    + 'Supports hints, icons, custom separators, and auto-generated labels from the field path.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiRangeDateInput('travelDates', { hint: 'Select your travel dates' }),
    _guiRangeDateInput('projectTimeline', { separator: '→', icon: 'calendar' }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
