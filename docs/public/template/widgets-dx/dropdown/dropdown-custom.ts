import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('selection', {
    items: [
      {
        template: {
          name: 'USA',
          code: 'US',
        },
        value: 'us',
      },
      {
        template: {
          name: 'Canada',
          code: 'CA',
        },
        value: 'ca',
      },
    ],
    labelField: 'name',
    valueField: 'code',
    searchFields: ['name', 'code'],
    label: 'Custom Fields',
    uid: 'dropdown_custom',
  }),
];
