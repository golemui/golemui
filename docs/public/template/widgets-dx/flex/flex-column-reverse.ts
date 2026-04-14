import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'flex_column_reverse',
      kind: 'layout',
      type: 'flex',
      props: {
        direction: 'column-reverse',
      },
      children: [
        {
          uid: 'cr1',
          kind: 'input',
          type: 'textinput',
          path: 'cr1',
          label: 'First Field',
        },
        {
          uid: 'cr2',
          kind: 'input',
          type: 'textinput',
          path: 'cr2',
          label: 'Second Field',
        },
      ],
    },
  ],
});
