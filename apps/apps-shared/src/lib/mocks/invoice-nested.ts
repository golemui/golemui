import { type Form } from '@golemui/core';
import { type Example } from './types';

const data = {
  projects: [
    {
      name: 'Website redesign',
      tasks: [
        { description: 'Homepage design', hours: 12, rate: 95 },
        { description: 'Responsive layout', hours: 8, rate: 95 },
      ],
    },
    {
      name: 'Brand identity',
      tasks: [{ description: 'Logo design', hours: 6, rate: 110 }],
    },
  ],
};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const invoiceNested: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/invoice-nested.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
