import { defineForm } from '@golemui/core';

export const users = defineForm({
  states: {
    itsFive: '$form.something === "5"',
  },
  form: [
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      label: 'The List Name',
      'label.itsFive': 'Its five!!',
      path: 'listName',
      readonly: true,
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'control',
      widget: 'textinput',
      label: 'Something',
      path: 'something',
      defaultValue: 'Type 5 should change the label on the list name',
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Cant Select me',
      path: 'nocheckable',
      readonly: true,
    },
    {
      uid: '',
      kind: 'control',
      widget: 'checkbox',
      label: 'Select me!',
      path: 'checkable',
    },
  ],
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
