import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.radiogroup('preference', {
    options: [
      {
        name: 'Choice 1',
        id: '1',
      },
      {
        name: 'Choice 2',
        id: '2',
      },
    ],
    labelField: 'name',
    valueField: 'id',
    label: 'Select your preference',
    uid: 'radiogroup_custom',
  }),
];
