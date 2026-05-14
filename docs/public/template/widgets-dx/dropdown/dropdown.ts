import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('selection', {
    items: ['Apple', 'Banana', 'Cherry'],
    placeholder: 'Type to search...',
    label: 'Select an Item',
    uid: 'dropdown_id',
  }),
];
