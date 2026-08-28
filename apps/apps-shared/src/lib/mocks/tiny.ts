import { type Form } from '@golemui/core';
import { type Example } from './types';
import tinyForm from './tiny.form.json';

const data = {};

/**
 * i18next Resource Bundle
 */

const resources = {};

export const tiny: Example = {
  data,
  form: tinyForm as unknown as Form<string>,
  resources,
};
