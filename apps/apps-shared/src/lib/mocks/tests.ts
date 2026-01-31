import { defineForm } from '@golemui/core';
import { Example } from './types';

const data = { 'complex-renderer': 'one', 'dropdown-complex-renderer': 'two' };

const form = defineForm({
  states: {
    register: '$form.registerMode === true',
  },
  form: [
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Register',
      path: 'registerMode',
    },
    (api) => {
      return {
        uid: 'input-name2',
        kind: 'control',
        widget: 'textinput',
        path: 'details.clientName2',
        label: api?.errors && api.touched ? `Error: ${api?.errors}` : 'Ohmmmm',
        props: {
          placeholder: 'e.g. Jane Doe',
        },
        validator: { type: 'string', required: true, minLength: 3 },
      };
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

export const tests: Example = {
  data,
  form,
  resources,
};
