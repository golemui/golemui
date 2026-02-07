import { defineForm, InputWidget } from '@golemui/core';
import { TextinputProps } from '@golemui/shared-vanilla';
import { Example } from './types';

const data = { user: { id: 'ASDFGHJKL4567' } };

const states = {
  register: '$form.registerMode === true',
  'register:tall': '$form.user.height > 180',
  'register:minor': '$form.user.age < 18',
  'register:minor:canSubmit': '$form.terms === true && $form.parentalApproval === true',
  'register:adult': '$form.user.age >= 18',
  'register:adult:canSubmit': '$form.terms === true',
};

type States = keyof typeof states;
type TextInput = InputWidget<string, States, any, TextinputProps>;

const form = defineForm({
  states,
  form: [
    {
      uid: '',
      kind: 'display',
      type: 'heading',
      props: {
        text: 'Login',
        'text.register': 'Register',
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      label: 'User Id',
      path: 'user.id',
      readonly: true,
      props: {
        placeholder: 'asasad',
        'placeholder.register:minor': 'asdada',
        'icon.register': 'asdad',
      },
    } satisfies TextInput,
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      label: 'User Name',
      path: 'user.name',
      validator: { type: 'custom', allowedNames: ['Joan', 'Raul'] },
      'validator.register': { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      label: 'User Email',
      path: 'user.email',
      validator: { type: 'string', required: true, format: 'email' },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      label: 'User Password',
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
      kind: 'input',
      type: 'textinput',
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
      kind: 'input',
      type: 'textinput',
      label: 'User Age',
      path: 'user.age',
      defaultValue: 0,
      validator: { type: 'string', required: true },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      label: 'User Height',
      path: 'user.height',
      defaultValue: '170',
      validator: { type: 'string', required: true },
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Play Basketball',
      path: 'user.playBasketball',
      include: { in: ['register:tall'] },
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Register',
      props: {
        checkboxPosition: 'left',
        'checkboxPosition.register': 'right',
      },
      path: 'registerMode',
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Accept Terms',
      path: 'terms',
      include: { in: ['register'] },
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'Parental Approval!',
      path: 'parentalApproval',
      include: { in: ['register:minor'] },
    },
    {
      uid: '',
      kind: 'display',
      type: 'alert',
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
      kind: 'action',
      type: 'button',
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
