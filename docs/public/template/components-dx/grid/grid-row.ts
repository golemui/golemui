import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'grid_row',
      kind: 'layout',
      type: 'grid',
      props: {
        direction: 'row',
      },
      children: [
        {
          uid: 'r1',
          kind: 'input',
          type: 'textinput',
          path: 'r1',
          label: 'Left Field',
        },
        {
          uid: 'r2',
          kind: 'input',
          type: 'textinput',
          path: 'r2',
          label: 'Right Field',
        },
      ],
    },
  ],
});
