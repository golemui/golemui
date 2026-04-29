import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('selection', {
    items: [
      {
        template: 'Apple',
        value: 'apple',
      },
      {
        template: 'Banana',
        value: 'banana',
      },
    ],
    hint: 'Start typing to filter the available items',
    label: 'Select an Item',
    uid: 'dropdown_hint',
  }),
];
