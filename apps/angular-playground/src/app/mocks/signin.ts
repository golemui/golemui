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
        on: { load: 'user.email loaded' },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        path: 'user.password',
        required: true,
        on: { change: 'checkPasswordMatch' },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'Confirm Password',
        path: 'confirm',
        on: { change: 'checkPasswordMatch' },
        include: { in: ['register'] },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'checkbox',
        label: 'Register',
        path: 'registerMode',
        on: { change: 'registerModeChange' },
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
      },
    ],
  },
});
