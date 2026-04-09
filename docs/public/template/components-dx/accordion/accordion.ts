import { golemForm } from '@golemui/gui-shared';

export default golemForm().create({
  form: [
    {
      uid: 'accordion_basic',
      kind: 'layout',
      type: 'accordion',
      props: {
        sections: [
          {
            uid: 'personal',
            label: 'Personal Information',
          },
          {
            uid: 'account',
            label: 'Account Settings',
          },
        ],
        defaultOpen: {
          personal: true,
        },
      },
      children: [
        {
          uid: 'personal',
          kind: 'input',
          type: 'textinput',
          path: 'name',
          label: 'Full Name',
        },
        {
          uid: 'account',
          kind: 'input',
          type: 'textinput',
          path: 'email',
          label: 'Email Address',
        },
      ],
    },
  ],
});
