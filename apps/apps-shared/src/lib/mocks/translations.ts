import { defineForm } from '@golemui/core';

export const translationsFormData = { user: { id: 'ASDFGHJKL4567', name: 'Mr. Pump' } };

export const translationsForm = defineForm({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'display',
      widget: 'heading',
      props: {
        text: 'Login',
        'text.register': 'Register',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'user.id',
      readonly: true,
    },
    {
      uid: '',
      kind: 'control',
      label: 'Name',
      widget: 'textinput',
      path: 'user.name',
    },
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: {
          key: 'alert.login',
          default: 'Hello {{name}}. Please, login (default)',
          params: {
            name: '$form.user.name',
          },
        },
        'text.register': {
          key: 'alert.register',
          default: 'Hello {{name}}. You can Register now (default)',
          params: {
            name: '$form.user.name',
          },
        },
        'level.register': 'success',
      },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Register',
      path: 'registerMode',
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Login',
      'label.register': 'Register',
      on: {
        click: 'handleLogin',
        'click.register': 'handleRegister',
      },
    },
  ],
});
