import { defineForm } from '@golemui/core';

export const kitchenSink = defineForm({
  states: {
    limitReached: '$form.users?.length === 5',
    hasSubregion: `!!$form.subregion`,
  },
  form: [
    {
      uid: '',
      kind: 'display',
      widget: 'heading',
      props: {
        text: 'KITCHEN SINK',
        level: 3,
      },
    },
    {
      uid: '',
      kind: 'layout',
      widget: 'tabs',
      props: {
        defaultOpen: 'tab8',
        tabs: [
          { label: 'Alert Component', uid: 'tab1' },
          { label: 'Stack Layout', uid: 'tab2' },
          { label: 'Repeater Component', uid: 'tab3' },
          { label: 'Checkbox Component', uid: 'tab4' },
          { label: 'Accordion Layout', uid: 'tab5' },
          { label: 'Textinput Component', uid: 'tab6' },
          { label: 'Select Component', uid: 'tab7' },
          { label: 'Number Component', uid: 'tab8' },
        ],
      },
      children: [
        {
          uid: 'tab1',
          kind: 'layout',
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'display',
              widget: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'warning',
              },
            },
            {
              uid: '',
              kind: 'display',
              widget: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'success',
              },
            },
            {
              uid: '',
              kind: 'display',
              widget: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'error',
              },
            },
            {
              uid: '',
              kind: 'display',
              widget: 'alert',
              props: {
                text: 'Some fields need your attention',
                level: 'info',
              },
            },
            {
              uid: '',
              kind: 'display',
              widget: 'alert',
              props: {
                text: 'Some fields need your attention',
              },
            },
          ],
        },
        {
          uid: 'tab2',
          kind: 'layout',
          widget: 'stack',
          props: {
            direction: 'horizontal',
            'direction.limitReached': 'vertical',
          },
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'listName',
            },
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'listOwner',
            },
          ],
        },
        {
          uid: 'tab3',
          kind: 'layout',
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'repeater',
              path: 'users',
              props: {
                addLabel: 'Add new developer',
                'addLabel.limitReached': "Limit Reached, you can't add more",
                removeLabel: 'Remove developer',
                limit: 5,
                template: {
                  uid: '',
                  kind: 'layout',
                  widget: 'stack',
                  children: [
                    {
                      uid: '',
                      kind: 'control',
                      widget: 'textinput',
                      path: 'users.items.firstName',
                    },
                    {
                      uid: '',
                      kind: 'control',
                      widget: 'textinput',
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
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'checkbox',
              label: 'Create new account?',
              path: 'isNewUser',
              props: {},
            },
            {
              uid: '',
              kind: 'control',
              widget: 'checkbox',
              label: 'Create new account?',
              path: 'isNewUser',
              props: {
                checkboxPosition: 'left',
                hint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'checkbox',
              label: 'Create new account?',
              path: 'isNewUser',
              props: {
                hint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis feugiat quam. Duis est justo, tincidunt eu risus id, gravida rutrum ipsum. Nam mattis felis quis interdum pretium. Nunc ipsum orci, consectetur nec turpis in, luctus rutrum lectus. In ultrices augue erat, id molestie tortor fringilla ac. Nullam a nibh viverra, auctor sapien vel, commodo felis. Aliquam erat volutpat. Aliquam hendrerit odio in molestie malesuada. Sed a sem nec ante gravida pretium.',
              },
            },
          ],
        },
        {
          uid: 'tab5',
          kind: 'layout',
          widget: 'accordion',
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
              widget: 'stack',
              children: [
                {
                  uid: '',
                  kind: 'control',
                  widget: 'textinput',
                  path: 'shoppingCart.firstName',
                },
                {
                  uid: '',
                  kind: 'control',
                  widget: 'textinput',
                  path: 'shoppingCart.lastName',
                },
              ],
            },
            {
              uid: 'section2',
              kind: 'layout',
              widget: 'stack',
              children: [
                {
                  uid: '',
                  kind: 'control',
                  widget: 'textinput',
                  path: 'shoppingCart.shippingAddress',
                },
                {
                  uid: '',
                  kind: 'control',
                  widget: 'textinput',
                  path: 'shoppingCart.shippingState',
                },
              ],
            },
            {
              uid: 'section3',
              kind: 'layout',
              widget: 'stack',
              children: [
                {
                  uid: '',
                  kind: 'control',
                  widget: 'textinput',
                  path: 'shoppingCart.billingAddress',
                },
                {
                  uid: '',
                  kind: 'control',
                  widget: 'textinput',
                  path: 'shoppingCart.billingState',
                },
              ],
            },
          ],
        },
        {
          uid: 'tab6',
          kind: 'layout',
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'textinput',
            },
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'textinput',
              props: {
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'textinput',
              props: {
                hint: 'This is a hint',
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'textinput',
              props: {
                icon: 'material-icons material-icons-phone_callback',
                hint: 'This is a hint',
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'textinput',
              path: 'textinput',
              props: {
                icon: 'material-icons material-icons-phone_callback',
                iconPosition: 'right',
                hint: 'This is a hint',
                placeholder: 'Please enter your phone number',
              },
            },
          ],
        },
        {
          uid: 'tab7',
          kind: 'layout',
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'select',
              path: 'greeting',
              label: 'Greeting',
              readonly: true,
              props: {
                icon: 'material-icons material-icons-phone_callback',
                hint: 'This is a hint',
                options: ['hello', 'bye'],
                placeholder: 'Please, select an option',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'select',
              path: 'wrongGreeting',
              props: {
                icon: 'material-icons material-icons-phone_callback',
                iconPosition: 'right',
                hint: 'This is a hint',
                options: ['hello', 'bye'],
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'select',
              path: 'greetingIndex',
              props: {
                options: [
                  { label: 'hello.1', value: 1 },
                  { label: 'bye.2', value: 2 },
                ],
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'select',
              path: 'subregion',
              label: 'Country subregion',
              on: {
                load: 'getSubregions',
                change: 'getCountries',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'select',
              path: 'country',
              include: { in: ['hasSubregion'] },
            },
          ],
        },
        {
          uid: 'tab8',
          kind: 'layout',
          widget: 'stack',
          children: [
            {
              uid: '',
              kind: 'control',
              widget: 'number',
              path: 'number',
            },
            {
              uid: '',
              kind: 'control',
              widget: 'number',
              path: 'number',
              props: {
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'number',
              path: 'number',
              props: {
                hint: 'This is a hint',
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'number',
              path: 'number',
              props: {
                icon: 'material-icons material-icons-phone_callback',
                hint: 'This is a hint',
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'number',
              path: 'number',
              props: {
                icon: 'material-icons material-icons-phone_callback',
                iconPosition: 'right',
                hint: 'This is a hint',
                placeholder: 'Please enter your phone number',
              },
            },
            {
              uid: '',
              kind: 'control',
              widget: 'number',
              path: 'height',
              props: {
                placeholder: 'Please enter your height in meters (min 0 and max 2.5)',
                step: 0.01,
                min: 0,
                max: 2.5,
              },
              validator: { type: 'number', minimum: 0, maximum: 2.5 },
            },
          ],
        },
      ],
    },
    {
      uid: '',
      kind: 'interactive',
      widget: 'button',
      label: 'Create',
      on: {
        click: 'createList',
      },
    },
  ],
});

export const kitchenSinkData = {
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
