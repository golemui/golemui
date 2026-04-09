import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'radiogroup_custom',
      kind: 'input',
      type: 'radiogroup',
      path: 'preference',
      label: 'Select your preference',
      props: {
        options: [
          {
            name: 'Choice 1',
            id: '1',
          },
          {
            name: 'Choice 2',
            id: '2',
          },
        ],
        labelField: 'name',
        valueField: 'id',
      },
    },
  ],
});
