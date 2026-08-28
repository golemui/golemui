import { type Form } from '@golemui/core';
import { type Example } from './types';
import signinForm from './signin.form.json';

const data = { user: { id: 'ASDFGHJKL4567' } };

/**
 * i18next Resource Bundle
 */
const resources = {};

export const signin: Example = {
  data,
  form: signinForm as unknown as Form<string>,
  resources,
};
