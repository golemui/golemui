import { Example } from './types';
import { golemForm } from '@golemui/shared-vanilla';

const data = {};

const form = golemForm().create({
  form: [
    {
      kind: 'input',
      type: 'checkbox',
      label: 'Register',
      path: 'registerMode',
    },
    {
      kind: 'input',
      type: 'checkbox',
      label: 'I am eating',
      path: 'eatingMode',
    },
    {
      type: 'alert',
      kind: 'display',
      props: {
        text: 'Registering',
        level: 'success',
      },
      include: { when: '$form.registerMode === true' },
    },
    {
      type: 'alert',
      kind: 'display',
      props: {
        text: 'Not eating',
        level: 'warning',
      },
      exclude: { when: '$form.eatingMode === true' },
    },
    {
      kind: 'input',
      type: 'textinput',
      path: 'details.clientName',
      label: 'Client Name',
      props: {
        placeholder: 'e.g. Jane Doe',
      },
      validator: { type: 'string', required: true, minLength: 3 },
    },
    {
      kind: 'action',
      type: 'button',
      label: 'Login',
      on: {
        click: 'submit',
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
