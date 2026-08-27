import { type Form } from '@golemui/core';
import { type Example } from './types';
import demoValidationForm from './demo-validation.form.json';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false, // Toggles the UI state
    notes: '',
  },
};

/**
 * i18next Resource Bundle
 */

const resources = {};

export const validationDemo: Example = {
  data,
  form: demoValidationForm as unknown as Form<string>,
  resources,
};
