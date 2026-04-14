import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'flex_row_reverse',
      kind: 'layout',
      type: 'flex',
      props: {
        direction: 'row-reverse',
      },
      children: [
        {
          uid: 'rr1',
          kind: 'input',
          type: 'textinput',
          path: 'rr1',
          label: 'First Field',
          size: 1,
        },
        {
          uid: 'rr2',
          kind: 'input',
          type: 'textinput',
          path: 'rr2',
          label: 'Second Field',
          size: 1,
        },
      ],
    },
  ],
});
