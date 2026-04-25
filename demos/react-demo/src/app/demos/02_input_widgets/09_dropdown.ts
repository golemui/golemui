import { FormDemoDefinition } from '../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

export const dropdownDemo: FormDemoDefinition = {
  title: '9. Dropdown',
  category: 'Ch2: Input Widgets',
  description:
    'A searchable dropdown with item templates. '
    + 'Unlike select, dropdown uses ListItem (template/value) and supports custom height and search.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.dropdown('country', {
      items: [
        { template: 'United States', value: 'us' },
        { template: 'Spain', value: 'es' },
        { template: 'Japan', value: 'jp' },
      ],
      placeholder: 'Choose a country...',
    }),
    gui.inputs.dropdown('venue', {
      items: [
        { template: 'Grand Ballroom — 500 seats', value: 'ballroom' },
        { template: 'Conference Hall A — 200 seats', value: 'hall-a' },
        { template: 'Rooftop Terrace — 100 seats', value: 'terrace' },
      ],
      placeholder: 'Select a venue...',
      height: 200,
    }),
  ],
  formConfig: () => ({
    onSubmit: (data: any) => console.log('Form submitted:', data),
  }),
};
