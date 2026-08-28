import { type Form } from '@golemui/core';
import { type Example } from './types';
import itemRenderersForm from './item-renderers.form.json';

const data = { 'complex-renderer': 'one', 'dropdown-complex-renderer': 'two' };

/**
 * i18next Resource Bundle
 */
const resources = {};

export const itemRenderers: Example = {
  data,
  form: itemRenderersForm as unknown as Form<string>,
  resources,
};
