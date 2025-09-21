import { defineForm } from '@formforge/core';

export const signin = defineForm({
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
        path: 'user.email',
        required: true,
        defaultValue: 'joan@joan.com',
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
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
      /*{
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
        on: {
          click: 'login',
          'click.register': 'register',
        },
      },*/
    ],
  },
});
