import { type Form } from '@golemui/core';
import { type Example } from './types';
import invoiceForm from './invoice.form.json';

const data = {};

/**
 * i18next Resource Bundle
 */
const resources = {};

export const invoice: Example = {
  data,
  form: invoiceForm as unknown as Form<string>,
  resources,
};
