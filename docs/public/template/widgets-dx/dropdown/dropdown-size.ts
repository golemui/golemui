import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.dropdown('selection', {
    items: [
      { template: 'One', value: 1 },
      { template: 'Two', value: 2 },
      { template: 'Three', value: 3 },
      { template: 'Four', value: 4 },
      { template: 'Five', value: 5 },
      { template: 'Six', value: 6 },
      { template: 'Seven', value: 7 },
      { template: 'Eight', value: 8 },
    ],
    hint: 'Open the dropdown to see the taller list with larger rows',
    height: 200,
    itemHeight: 56,
    label: 'Pick a number',
    uid: 'dropdown_size',
  }),
];
