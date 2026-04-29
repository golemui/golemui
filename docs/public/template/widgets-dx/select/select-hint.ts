import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.select('country', {
    hint: 'Please select your current country of residence.',
    options: [
      {
        label: 'United States',
        value: 'us',
      },
    ],
    label: 'Country',
  }),
];
