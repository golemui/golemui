import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.list('selection', {
    items: ['Option A', 'Option B'],
    hint: 'Please select one of the available choices from the list.',
    label: 'Pick an option',
    uid: 'list_hint',
  }),
];
