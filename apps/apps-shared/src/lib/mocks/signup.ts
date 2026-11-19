import { type Form } from '@golemui/core';
import { type Example } from './types';
import signupForm from './signup.form.json';

export const signup: Example = {
  data: {},
  form: signupForm as unknown as Form<string>,
  resources: {},
};
