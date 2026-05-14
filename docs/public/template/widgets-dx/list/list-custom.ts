import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.list('selection', {
    items: [
      { name: 'USA', code: 'US' },
      { name: 'Canada', code: 'CA' },
      { name: 'Mexico', code: 'MX' },
      { name: 'Brazil', code: 'BR' },
      { name: 'Argentina', code: 'AR' },
    ],
    height: 200,
    itemHeight: 40,
    labelField: 'name',
    valueField: 'code',
    label: 'Custom Fields',
    uid: 'list_custom',
  }),
];
