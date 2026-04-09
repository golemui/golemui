import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'list_hint',
      kind: 'input',
      type: 'list',
      path: 'selection',
      label: 'Pick an option',
      props: {
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
      },
    },
  ],
});
