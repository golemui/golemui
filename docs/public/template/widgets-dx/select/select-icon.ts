import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.select('country', {
    icon: 'fas fa-globe',
    options: [
      {
        label: 'United States',
        value: 'us',
      },
    ],
    label: 'Country',
  }),
];
