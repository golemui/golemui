import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.select('country', {
    labelField: 'name',
    valueField: 'code',
    options: [
      {
        name: 'United States',
        code: 'us',
      },
      {
        name: 'Canada',
        code: 'ca',
      },
    ],
    label: 'Country',
  }),
];
