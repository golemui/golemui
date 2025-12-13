import { defineForm } from '@golemui/core';

export const callbacksData = { registerMode: false };

export const callbacks = defineForm({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'layout',
      widget: 'stack',
      children: [
        {
          uid: '',
          kind: 'display',
          widget: 'heading',
          props: {
            text: ({ $form }) => {
              return $form['registerMode'] ? 'Register' : 'Login';
            },
          },
        },
      ],
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: ({ $form }) => {
        return $form['registerMode'] ? 'Change to Login' : 'Change to Register';
      },
      props: {
        checkboxPosition: 'left',
      },
      path: 'registerMode',
    },
  ],
});
