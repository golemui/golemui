import { Form } from '@golemui/core';
import { Example } from './types';

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
  form: async () => {
    const baseUrl = new URL('/assets/mocks/selects.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
