import { defineForm } from '@golemui/core';
import { Example } from './types';

const form = defineForm({
  states: {
    limitReached: '$form.users.length === 5',
  },
  form: [
    {
      uid: '',
      kind: 'layout',
      type: 'tabs',
      props: {
        defaultOpen: 'tab5',
        tabs: [
          { label: 'Alert Component', uid: 'tab1' },
          { label: 'Flex Layout', uid: 'tab2' },
          { label: 'Repeater Component', uid: 'tab3' },
          { label: 'Checkbox Component', uid: 'tab4' },
          { label: 'Accordion Layout', uid: 'tab5' },
        ],
      },
      children: [
        {
          uid: 'tab1',
          kind: 'display',
          type: 'alert',
          props: {
            text: 'Some fields need your attention',
            level: 'warning',
          },
        },
        {
          uid: 'tab2',
          kind: 'layout',
          type: 'grid',
          props: {
            direction: 'row',
            'direction.limitReached': 'vertical',
          },
          children: [
            {
              uid: '',
              kind: 'input',
              type: 'textinput',
              path: 'listName',
            },
            {
              uid: '',
              kind: 'input',
              type: 'textinput',
              path: 'listOwner',
            },
          ],
        },
        {
          uid: 'tab3',
          kind: 'layout',
          type: 'grid',
          props: {
            direction: 'column',
          },
          children: [
            {
              uid: '',
              kind: 'input',
              type: 'repeater',
              path: 'users',
              props: {
                addLabel: 'Add new developer',
                'addLabel.limitReached': "Limit Reached, you can't add more",
                removeLabel: 'Remove developer',
                limit: 5,
                template: {
                  uid: '',
                  kind: 'layout',
                  type: 'grid',
                  props: {
                    direction: 'column',
                  },
                  children: [
                    {
                      uid: '',
                      kind: 'input',
                      type: 'textinput',
                      path: 'users.items.firstName',
                    },
                    {
                      uid: '',
                      kind: 'input',
                      type: 'textinput',
                      path: 'users.items.lastName',
                    },
                  ],
                },
              },
            },
          ],
        },
        {
          uid: 'tab4',
          kind: 'layout',
          type: 'grid',
          props: {
            direction: 'column',
          },
          children: [
            {
              uid: '',
              kind: 'input',
              type: 'checkbox',
              label: 'Create new account?',
              path: 'isNewUser',
            },
          ],
        },
        {
          uid: 'tab5',
          kind: 'layout',
          type: 'accordion',
          props: {
            singleOpen: false,
            defaultOpen: {
              section1: true,
            },
            sections: [
              { label: 'Personal Information', uid: 'section1' },
              { label: 'Shipping Address', uid: 'section2' },
              { label: 'Billing Address', uid: 'section3' },
            ],
          },
          children: [
            {
              uid: 'section1',
              kind: 'layout',
              type: 'grid',
              props: {
                direction: 'column',
              },
              children: [
                {
                  uid: '',
                  kind: 'input',
                  type: 'textinput',
                  path: 'shoppingCart.firstName',
                },
                {
                  uid: '',
                  kind: 'input',
                  type: 'textinput',
                  path: 'shoppingCart.lastName',
                },
              ],
            },
            {
              uid: 'section2',
              kind: 'layout',
              type: 'grid',
              props: {
                direction: 'column',
              },
              children: [
                {
                  uid: '',
                  kind: 'input',
                  type: 'textinput',
                  path: 'shoppingCart.shippingAddress',
                },
                {
                  uid: '',
                  kind: 'input',
                  type: 'textinput',
                  path: 'shoppingCart.shippingState',
                },
              ],
            },
            {
              uid: 'section3',
              kind: 'layout',
              type: 'grid',
              props: {
                direction: 'column',
              },
              children: [
                {
                  uid: '',
                  kind: 'input',
                  type: 'textinput',
                  path: 'shoppingCart.billingAddress',
                },
                {
                  uid: '',
                  kind: 'input',
                  type: 'textinput',
                  path: 'shoppingCart.billingState',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      uid: '',
      kind: 'action',
      type: 'button',
      label: 'Create',
      on: {
        click: 'submit',
      },
    },
  ],
});

const data = {
  listName: 'Development Team',
  users: [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
    },
    {
      firstName: 'Charlie',
    },
    {
      firstName: 'Diana',
      lastName: 'Rodriguez',
    },
  ],
};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const tabs: Example = {
  data,
  form,
  resources,
};
