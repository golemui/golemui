import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.select('country', {
    options: [
      {
        label: 'United States',
        value: 'us',
      },
      {
        label: 'Canada',
        value: 'ca',
      },
      {
        label: 'Mexico',
        value: 'mx',
      },
    ],
    label: 'Country',
  }),
];
