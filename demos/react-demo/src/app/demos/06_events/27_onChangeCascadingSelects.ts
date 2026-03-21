import { FormDemoDefinition } from '../../../formRegistry.domain';
import { _guiSelect, _guiHorizontalStack } from '@golemui/gui-shared';

const countries = [
  { label: 'United States', value: 'US' },
  { label: 'France', value: 'FR' },
  { label: 'Germany', value: 'DE' },
];

const subregionsByCountry: Record<string, { label: string; value: string }[]> = {
  US: [
    { label: 'California', value: 'CA' },
    { label: 'New York', value: 'NY' },
    { label: 'Texas', value: 'TX' },
  ],
  FR: [
    { label: 'Ile-de-France', value: 'IDF' },
    { label: 'Provence', value: 'PAC' },
    { label: 'Brittany', value: 'BRE' },
  ],
  DE: [
    { label: 'Bavaria', value: 'BY' },
    { label: 'Berlin', value: 'BE' },
    { label: 'Saxony', value: 'SN' },
  ],
};

export const onChangeCascadingSelectsDemo: FormDemoDefinition = {
  title: '27. onChange — Cascading Selects',
  category: 'Ch6: Events',
  description:
    'Selecting a country populates the subregion dropdown with matching regions. '
    + 'The onChange callback on the country select reads the selected value and '
    + 'calls event.update to update the subregion options dynamically.',
  formDef: () =>
    _guiHorizontalStack([
      _guiSelect('country', {
        options: countries,
        label: 'Country',
        onChange: (event) => {
          const selected = event.data?.country;
          const subs = subregionsByCountry[selected] ?? [];
          event.update({ path: 'subregion', options: subs });
        },
      }),
      _guiSelect('subregion', {
        options: [],
        label: 'Subregion',
      }),
    ]),
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
