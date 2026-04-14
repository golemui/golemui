import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'dropdown_hint',
      kind: 'input',
      type: 'dropdown',
      path: 'selection',
      label: 'Select an Item',
      props: {
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
      },
    },
  ],
});
