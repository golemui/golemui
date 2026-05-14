import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.select('country', {
    icon: 'language',
    options: [
      {
        label: 'United States',
        value: 'us',
      },
    ],
    label: 'Country',
  }),
];
