import { type Form } from '@golemui/core';
import { type Example } from './types';
import demoA11yForm from './demo-a11y.form.json';

const data = {
  details: {
    clientName: '',
    date: null,
    isRemote: false,
    notes: '',
  },
};

/**
 * i18next Resource Bundle
 */

const resources = {};

export const a11yDemo: Example = {
  data,
  form: demoA11yForm as unknown as Form<string>,
  resources,
};
