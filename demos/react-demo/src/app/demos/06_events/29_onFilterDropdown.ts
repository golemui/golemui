import { FormDemoDefinition } from '../../../formRegistry.domain';
import { gui } from '@golemui/gui-shared';

const allCities = [
  { template: 'Paris', value: 'paris' },
  { template: 'Paraná', value: 'parana' },
  { template: 'London', value: 'london' },
  { template: 'Los Angeles', value: 'la' },
  { template: 'Berlin', value: 'berlin' },
  { template: 'Barcelona', value: 'barcelona' },
  { template: 'Tokyo', value: 'tokyo' },
  { template: 'Toronto', value: 'toronto' },
];

export const onFilterDropdownDemo: FormDemoDefinition = {
  title: '29. onFilter — Dropdown',
  category: 'Ch6: Events',
  description:
    'Typing in the dropdown filters the city list. The onFilter callback receives ' +
    'the search term via event.detail and returns filtered options via event.update. ' +
    'Try typing "par" to see only Paris and Paraná.',
  formDef: () => [
    gui.inputs.textInput('name'),
    gui.inputs.dropdown('city', {
      items: allCities,
      placeholder: 'Search for a city...',
      onFilter: (event) => {
        const query = event.detail ?? '';
        const filtered = allCities.filter((c) =>
          String(c.template).toLowerCase().includes(query.toLowerCase()),
        );
        event.update({ path: 'city', items: filtered });
      },
    }),
  ],
  formConfig: () => ({ suppressAutomaticSubmit: true }),
};
