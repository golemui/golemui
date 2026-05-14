import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('country', {
    items: [
      { name: 'France', code: 'FR' },
      { name: 'Germany', code: 'DE' },
      { name: 'Spain', code: 'ES' },
      { name: 'United Kingdom', code: 'GB' },
      { name: 'United States', code: 'US' },
    ],
    autocomplete: 'country-name',
    labelField: 'name',
    valueField: 'code',
    searchFields: ['name'],
    label: 'Country',
    uid: 'dropdown_autocomplete',
  }),
];
