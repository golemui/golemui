import { type Form } from '@golemui/core';
import { type Example } from './types';
import selectsForm from './selects.form.json';

const data = {
  greeting: 'bye',
  wrongGreeting: 'aaaaaa',
  greetingIndex: 2,
};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const selects: Example = {
  data,
  form: selectsForm as unknown as Form<string>,
  resources,
};
