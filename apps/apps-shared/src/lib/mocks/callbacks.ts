import { defineForm, GUIApi } from '@golemui/core';

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
            text: (form: GUIApi) => {
              return form.data.registerMode ? 'Register' : 'Login';
            },
          },
        },
      ],
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: ((form: GUIApi) => {
        return form.data.registerMode ? 'Change to Login' : 'Change to Register';
      }) as any,
      props: {
        checkboxPosition: 'left',
      },
      path: 'registerMode',
    },
  ],
});
