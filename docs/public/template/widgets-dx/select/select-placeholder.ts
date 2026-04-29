import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.select('country', {
    placeholder: 'Select your country',
    options: [
      {
        label: 'United States',
        value: 'us',
      },
      {
        label: 'Canada',
        value: 'ca',
      },
    ],
    label: 'Country',
  }),
];
