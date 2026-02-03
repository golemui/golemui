import { defineForm } from '@golemui/core';
import { Example } from './types';

const form = defineForm({
  states: {
    itsFive: '$form.something === "5"',
  },
  form: [
    {
      uid: '',
      kind: 'input',
      widget: 'textinput',
      label: 'The List Name',
      'label.itsFive': 'Its five!!',
      path: 'listName',
      readonly: true,
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      widget: 'textinput',
      label: 'Something',
      path: 'something',
      defaultValue: 'Type 5 should change the label on the list name',
    },
    {
      uid: '',
      kind: 'input',
      widget: 'checkbox',
      label: 'Cant Select me',
      path: 'nocheckable',
      readonly: true,
    },
    {
      uid: '',
      kind: 'input',
      widget: 'checkbox',
      label: 'Select me!',
      path: 'checkable',
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

export const users: Example = {
  data,
  form,
  resources,
};
