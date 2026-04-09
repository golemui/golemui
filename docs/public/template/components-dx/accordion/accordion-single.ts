import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'accordion_single',
      kind: 'layout',
      type: 'accordion',
      props: {
        sections: [
          {
            uid: 'sec1',
            label: 'First Section',
          },
          {
            uid: 'sec2',
            label: 'Second Section',
          },
        ],
        singleOpen: true,
      },
      children: [
        {
          uid: 'sec1',
          kind: 'input',
          type: 'textinput',
          path: 'f1',
          label: 'Field 1',
        },
        {
          uid: 'sec2',
          kind: 'input',
          type: 'textinput',
          path: 'f2',
          label: 'Field 2',
        },
      ],
    },
  ],
});
