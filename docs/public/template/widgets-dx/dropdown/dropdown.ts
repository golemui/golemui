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
      {
        template: 'Cherry',
        value: 'cherry',
      },
    ],
    placeholder: 'Type to search...',
    label: 'Select an Item',
    uid: 'dropdown_id',
  }),
];
