import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.list('selection', {
    items: [
      {
        template: 'Option A',
        value: 'a',
      },
      {
        template: 'Option B',
        value: 'b',
      },
    ],
    hint: 'Please select one of the available choices from the list.',
    label: 'Pick an option',
    uid: 'list_hint',
  }),
];
