import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.list('selection', {
    items: ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'],
    height: 200,
    itemHeight: 40,
    label: 'Pick an option',
    uid: 'list_id',
  }),
];
