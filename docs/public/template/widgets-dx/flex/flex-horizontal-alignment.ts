import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'row_centered',
      kind: 'layout',
      type: 'flex',
      props: {
        direction: 'row',
        justify: 'center',
        align: 'center',
        gap: 16,
      },
      children: [
        {
          uid: 'f1',
          kind: 'input',
          type: 'textinput',
          path: 'firstName',
          label: 'First Name',
          size: 1,
        },
        {
          uid: 'f2',
          kind: 'input',
          type: 'textinput',
          path: 'lastName',
          label: 'Last Name',
          size: 1,
        },
      ],
    },
  ],
});
