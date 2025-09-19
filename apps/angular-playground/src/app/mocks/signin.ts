import * as Core from '@formforge/core';

export const signin: Core.Form = {
  states: {
    register: '$.registerMode === true',
  },
  form: {
    uid: '',
    kind: 'layout',
    widget: 'stack',
    children: [
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'Email',
        'label.aaa': 'Email',
        path: 'user.email',
        required: true,
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'Password',
        path: 'user.password',
        required: true,
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'Confirm Password',
        path: 'confirm',
        include: { in: ['register'] },
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
        kind: 'button',
        widget: 'button',
        label: 'Login',
        'label.register': 'Register',
        'label.something': 'string',
        on: {
          click: 'login',
          'click.register': 'register',
        },
      },
    ],
  },
};
