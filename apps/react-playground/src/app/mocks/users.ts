import { defineForm } from '@formforge/core';

export const users = defineForm({
  form: {
    uid: '',
    kind: 'layout',
    widget: 'stack',
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
        widget: 'repeater',
        path: 'users',
        props: {
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
