import { gui } from '@golemui/gui-shared';

export default [
  gui.layouts.accordion([
    {
      label: 'Personal Information',
      uid: 'personal',
      children: [
        gui.inputs.textInput('name', {
          label: 'Full Name',
        }),
      ],
    },
    {
      label: 'Account Settings',
      uid: 'account',
      children: [
        gui.inputs.textInput('email', {
          label: 'Email Address',
        }),
      ],
    },
  ], {
    defaultOpen: {
      personal: true,
    },
    uid: 'accordion_basic',
  }),
];
