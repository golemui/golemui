import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'radiogroup_id',
      kind: 'input',
      type: 'radiogroup',
      path: 'preference',
      label: 'Select your preference',
      props: {
        options: [
          {
            label: 'Option A',
            value: 'a',
          },
          {
            label: 'Option B',
            value: 'b',
          },
          {
            label: 'Option C',
            value: 'c',
          },
        ],
      },
    },
  ],
});
