import { type Form } from '@golemui/core';
import { type Example } from './types';

const data = { 'complex-renderer': 'one', 'dropdown-complex-renderer': 'two' };

/**
 * i18next Resource Bundle
 */
const resources = {};

export const itemRenderers: Example = {
  data,
  form: async () => {
    const baseUrl = new URL('/assets/mocks/item-renderers.form.json', window.location.href).href;
    const json = await fetch(baseUrl).then((r) => r.json());
    return json as unknown as Form<string>;
  },
  resources,
};
