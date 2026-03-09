import { Example } from './types';
import shippingManifestForm from './shipping-manifest.form.json';
import { Form } from '@golemui/core';

const data = {};

const form = {
  ...shippingManifestForm,
  form: {
    uid: '',
    type: 'flex',
    kind: 'layout',
    children: shippingManifestForm.form,
  },
} as Form<string>;

/**
 * i18next Resource Bundle
 */
const resources = {};

export const shippingManifest: Example = {
  data,
  form,
  resources,
};
