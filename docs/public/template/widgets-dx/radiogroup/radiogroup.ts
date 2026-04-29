import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.radiogroup('preference', {
    options: [
      {
        label: 'Option A',
        value: 'a',
      },
      {
        label: 'Option B',
        value: 'b',
      },
      {
        label: 'Option C',
        value: 'c',
      },
    ],
    label: 'Select your preference',
    uid: 'radiogroup_id',
  }),
];
