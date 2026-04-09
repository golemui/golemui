import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'dropdown_id',
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
          {
            template: 'Cherry',
            value: 'cherry',
          },
        ],
        placeholder: 'Type to search...',
      },
    },
  ],
});
