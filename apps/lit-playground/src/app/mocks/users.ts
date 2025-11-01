import { defineForm } from '@formforge/core';

export const users = defineForm({
  states: {
    itsFive: '$form.something === "5"',
  },
  form: {
    uid: '',
    kind: 'layout',
    widget: 'stack',
    children: [
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'The List Name',
        'label.itsFive': 'Its five!!',
        path: 'listName',
        readonly: true,
        required: false,
      },
      {
        uid: '',
        kind: 'control',
        widget: 'textinput',
        label: 'Something',
        path: 'something',
        defaultValue: 'Type 5 should change the label on the list name',
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
