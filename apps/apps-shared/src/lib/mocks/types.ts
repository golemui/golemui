import { Form } from '@golemui/core';
import { Resource } from 'i18next';

export type FromLoaderFn = () => Promise<Form<string>>;

export interface Example {
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  form: Form<string> | FromLoaderFn;
  resources: Resource;
}
