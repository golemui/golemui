import { gui } from '@golemui/gui-shared';

export default [
  gui.inputs.list('selection', {
    items: [
      {
        template: 'Option 1',
        value: '1',
      },
      {
        template: 'Option 2',
        value: '2',
      },
      {
        template: 'Option 3',
        value: '3',
      },
      {
        template: 'Option 4',
        value: '4',
      },
      {
        template: 'Option 5',
        value: '5',
      },
    ],
    height: 200,
    itemHeight: 40,
    label: 'Pick an option',
    uid: 'list_id',
  }),
];
