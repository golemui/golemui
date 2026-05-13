import { Form } from '@golemui/core';
import { Example } from './types';

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
  form: async () => {
    const baseUrl = new URL('/assets/mocks/demo-a11y.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
