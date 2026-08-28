import { type Form } from '@golemui/core';
import { type Example } from './types';
import simpleSigninForm from './simple-signin.form.json';

/**
 * i18next Resource Bundle
 */
const resources = {};

export const simpleSignin: Example = {
  data: {},
  form: simpleSigninForm as unknown as Form<string>,
  resources,
};
