import { defineForm } from '@golemui/core';
import { Example } from './types';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false, // Toggles the UI state
    notes: '',
  },
};

const form = defineForm({
  form: [
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinput',
      props: {
        placeholder: 'Please enter your phone number',
      },
      validator: { type: 'string', minLength: 4, maxLength: 8, required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'dateInput',
      path: 'dateInput',
      props: {
        icon: 'material-icons material-icons-calendar_month',
      },
      validator: { type: 'string', required: true, format: 'date' },
    },
    {
      uid: '',
      kind: 'input',
      type: 'currency',
      path: 'currencyIconRightWithUSD',
      props: {
        placeholder: 'Please enter price in USD',
      },
      validator: { type: 'number', required: true, minimum: 100 },
    },
    {
      uid: '',
      kind: 'input',
      type: 'radiogroup',
      path: 'radiogroups.requiredUnselected',
      props: {
        options: ['hello', 'bye'],
      },
      validator: { type: 'string', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'checkbox',
      label: 'I accept the terms and conditions',
      path: 'isNewUserHint',
      props: {
        checkboxPosition: 'left',
      },
      validator: { type: 'boolean', required: true },
    },
    {
      uid: '',
      kind: 'input',
      type: 'number',
      path: 'number',
      label: 'Temperature',
      props: {
        placeholder: 'ºC',
        minimum: -45,
        maximum: 42,
        step: 0.5,
        autoGrow: true,
      },
      validator: { type: 'number', minimum: -45, maximum: 42, required: true },
    },
    {
      uid: 'register-submit',
      kind: 'action',
      type: 'button',
      label: 'Validate and submit form',
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

export const validationDemo: Example = {
  data,
  form,
  resources,
};
