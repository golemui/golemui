import { FormDemoDefinition } from '../../formRegistry.domain';
import { _guiDropdown, _guiInputs, _gslRoot } from '@golemui/gui-shared';

export const dropdownDemo: FormDemoDefinition = {
  title: '21. Dropdown',
  category: 'Ch1: First Form',
  description:
    'A searchable dropdown with item templates. '
    + 'Unlike select, dropdown uses ListItem (template/value) and supports custom height and search.',
  formDef: () => [
    _guiInputs({ name: 'string' }),
    _guiDropdown('country', {
      items: [
        { template: 'United States', value: 'us' },
        { template: 'Spain', value: 'es' },
        { template: 'Japan', value: 'jp' },
      ],
      placeholder: 'Choose a country...',
    }),
    _guiDropdown('venue', {
      items: [
        { template: 'Grand Ballroom — 500 seats', value: 'ballroom' },
        { template: 'Conference Hall A — 200 seats', value: 'hall-a' },
        { template: 'Rooftop Terrace — 100 seats', value: 'terrace' },
      ],
      placeholder: 'Select a venue...',
      height: 200,
    }),
  ],
  formSelectors: () =>
    _gslRoot({
      onSubmit: (data: any) => console.log('Form submitted:', data),
    }),
};
