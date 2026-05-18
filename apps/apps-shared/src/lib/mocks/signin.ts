import { type Form } from '@golemui/core';
import { type Example } from './types';

const data = { user: { id: 'ASDFGHJKL4567' } };

/**
 * i18next Resource Bundle
 */
const resources = {};

export const signin: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/signin.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
