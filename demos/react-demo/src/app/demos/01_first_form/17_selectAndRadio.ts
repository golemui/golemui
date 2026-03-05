import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiSelect,
  _guiRadiogroup,
  _guiInputs,
  _gslRoot,
} from '../../../services/dx';

export const selectAndRadioDemo: FormDemoDefinition = {
  title: '17. Select & Radiogroup',
  category: 'Ch1: First Form',
  description:
    'Select dropdowns and radio button groups — both take an options array.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiSelect('country', {
      options: [
        { label: 'United States', value: 'us' },
        { label: 'Spain', value: 'es' },
        { label: 'Japan', value: 'jp' },
      ],
      placeholder: 'Choose a country...',
    }),
    _guiRadiogroup('priority', {
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    }),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
