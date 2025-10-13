import { defineForm } from '@formforge/core';

export const users = defineForm({
  states: {
    limitReached: '$form.users.length === 5',
  },
  form: {
    uid: '',
    kind: 'layout',
    widget: 'stack',
    children: [
      {
        uid: '',
        kind: 'layout',
        widget: 'tabs',
        props: {
          defaultOpen: 'tab2',
          tabs: [
            { label: 'Alert Component', uid: 'tab1' },
            { label: 'Stack Layout', uid: 'tab2' },
            { label: 'Repeater Component', uid: 'tab3' },
            { label: 'Checkbox Component', uid: 'tab4' }
          ]
        },
        children: [
          {
            uid: 'tab1',
            kind: 'field',
            widget: 'alert',
            props: {
              text: 'Some fields need your attention',
              level: 'warning'
            },
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
              }
            ]
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
                path: 'isNewUser'
              }
            ]
          },
        ]
      },
      {
        uid: '',
        kind: 'button',
        widget: 'button',
        label: 'Create',
        on: {
          click: 'createList',
        },
      },
    ],
  },
});

export const usersData = {
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
