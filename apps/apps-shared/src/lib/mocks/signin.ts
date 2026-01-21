import { defineForm } from '@golemui/core';
import { Example } from './types';

const data = { user: { id: 'ASDFGHJKL4567' } };

const form = defineForm({
  states: {
    register: '$form.registerMode === true',
    'register:tall': '$form.user.height > 180',
    'register:minor': '$form.user.age < 18',
    'register:minor:canSubmit': '$form.terms === true && $form.parentalApproval === true',
    'register:adult': '$form.user.age >= 18',
    'register:adult:canSubmit': '$form.terms === true',
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
      widget: 'textinput',
      path: 'user.name',
      validator: { type: 'custom', allowedNames: ['Joan', 'Raul'] },
      'validator.register': { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'user.email',
      validator: { type: 'string', required: true, format: 'email' },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      'label.register': 'Password 1',
      props: {
        'placeholder.register': 'Enter password 1',
      },
      path: 'user.password',
      validator: {
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 20,
        pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]+$',
      },
      on: { 'change.register': 'checkPasswordMatch' },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      label: 'Confirm Password',
      props: {
        'placeholder.register': 'Enter password 2',
      },
      path: 'confirm',
      on: { change: 'checkPasswordMatch' },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'user.age',
      defaultValue: 0,
      validator: { type: 'string', required: true },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      path: 'user.height',
      defaultValue: '170',
      validator: { type: 'string', required: true },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      path: 'user.playBasketball',
      include: { in: ['register:tall'] },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Register',
      props: {
        checkboxPosition: 'left',
        'checkboxPosition.register': 'right',
      },
      path: 'registerMode',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Accept Terms',
      path: 'terms',
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Parental Approval!',
      path: 'parentalApproval',
      include: { in: ['register:minor'] },
    },
    {
      uid: '',
      kind: 'display',
      widget: 'alert',
      props: {
        text: 'Some fields need your attention',
        level: 'warning',
        'text.register:adult:canSubmit': 'You can Register now',
        'level.register:adult:canSubmit': 'success',
        'text.register:minor:canSubmit': 'You can Register now',
        'level.register:minor:canSubmit': 'success',
      },
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Login',
      'label.register': 'Register',
      disabled: false,
      'disabled.register': true,
      'disabled.register:minor:canSubmit': false,
      'disabled.register:adult:canSubmit': false,
      on: {
        click: 'handleLogin',
        'click.register': 'handleRegister',
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {};

export const signin: Example = {
  data,
  form,
  resources,
};
