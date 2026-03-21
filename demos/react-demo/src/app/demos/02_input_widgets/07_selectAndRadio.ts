import { FormDemoDefinition } from '../../formRegistry.domain';
import {
  _guiSelect,
  _guiRadiogroup,
  _guiInputs,
} from '@golemui/gui-shared';

export const selectAndRadioDemo: FormDemoDefinition = {
  title: '7. Select & Radiogroup',
  category: 'Ch2: Input Widgets',
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
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
