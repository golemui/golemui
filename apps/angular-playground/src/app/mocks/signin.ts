import { defineForm } from '@formforge/core';

export const signin = defineForm({
  states: {
    register:
      '$form.registerMode === true && $log($form.user.age, "age") >= 18',
    registerMinor: '$form.registerMode === true && $form.user.age < 18',
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
        disabled: true,
        'disabled.register': false,
        required: true,
        defaultValue: 'joan@joan.com',
        on: { load: 'userEmailLoaded' },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        path: 'user.password',
        required: true,
        'required.register': false,
        on: { change: 'checkPasswordMatch' },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'Confirm Password',
        path: 'confirm',
        on: { change: 'checkPasswordMatch' },
        include: { in: ['register', 'registerMinor'] },
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        path: 'user.age',
        defaultValue: 0,
        required: true,
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
