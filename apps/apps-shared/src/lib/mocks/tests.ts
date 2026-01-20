import { defineForm } from '@golemui/core';
import { Mock } from './types';

const data = { 'complex-renderer': 'one', 'dropdown-complex-renderer': 'two' };

const form = defineForm({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'layout',
      widget: 'accordion',
      props: {
        singleOpen: false,
        defaultOpen: {
          a: true,
        },
        sections: [
          { label: 'Personal Information', uid: 'a' },
          { label: 'Shipping Address', uid: 'b' },
        ],
      },
      children: [
        {
          uid: 'a',
          kind: 'control',
          widget: 'checkbox',
          label: 'Login',
          path: 'loginMode',
        },
        {
          uid: 'b',
          kind: 'control',
          widget: 'checkbox',
          label: 'Register',
          path: 'registerMode',
        },
      ],
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Login',
      'label.register': 'Register',
      on: {
        click: 'submit',
        'click.register': 'handleRegister',
      },
    },
  ],
});

/**
 * i18next Resource Bundle
 */
const resources = {};

export const tests: Mock = {
  data,
  form,
  resources,
};
