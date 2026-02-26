import { golemForm } from '@golemui/gui-components';
import { Example } from './types';

const data = {
  repeaters: {
    users: [
      {
        firstName: '0. Alice',
        lastName: '0. Johnson',
      },
      {
        firstName: '',
        lastName: '1. Smith',
      },
      {
        firstName: '2. Charlie',
      },
    ],
  },
};

const form = golemForm().create({
  states: {
    limitReached: '$form.repeaters.users?.length === 5',
  },
  form: [
    {
      kind: 'layout',
      type: 'flex',
      children: [
        {
          kind: 'input',
          type: 'repeater',
          path: 'repeaters.users',
          props: {
            addLabel: 'Add new developer',
            'addLabel.limitReached': "Limit Reached, you can't add more",
            removeLabel: 'Remove developer',
            limit: 5,
            template: {
              kind: 'layout',
              type: 'flex',
              children: [
                {
                  kind: 'input',
                  type: 'textinput',
                  path: 'repeaters.users.items.firstName',
                  validator: { type: 'string', required: true },
                },
                {
                  kind: 'input',
                  type: 'textinput',
                  path: 'repeaters.users.items.lastName',
                },
              ],
            },
          },
        },
      ],
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
