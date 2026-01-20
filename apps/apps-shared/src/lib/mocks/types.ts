import { Form } from '@golemui/core';
import { Resource } from 'i18next';

export interface Mock {
  data: Record<string, unknown>;
  form: Form<string>;
  resources: Resource;
}
