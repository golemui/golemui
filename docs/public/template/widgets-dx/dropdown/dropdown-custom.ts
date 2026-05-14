import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('selection', {
    items: [
      { name: 'USA', code: 'US' },
      { name: 'Canada', code: 'CA' },
    ],
    labelField: 'name',
    valueField: 'code',
    searchFields: ['name', 'code'],
    label: 'Custom Fields',
    uid: 'dropdown_custom',
  }),
];
