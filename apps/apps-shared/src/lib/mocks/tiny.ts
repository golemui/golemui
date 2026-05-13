import { Form } from '@golemui/core';
import { Example } from './types';

const data = {};

/**
 * i18next Resource Bundle
 */

const resources = {};

export const tiny: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/tiny.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
