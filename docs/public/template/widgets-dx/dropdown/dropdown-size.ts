import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('selection', {
    items: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'],
    hint: 'Open the dropdown to see the taller list with larger rows',
    height: 200,
    itemHeight: 56,
    label: 'Pick a number',
    uid: 'dropdown_size',
  }),
];
