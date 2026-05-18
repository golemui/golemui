import { type Form, type FormEvent } from '@golemui/core';
import { type Resource } from 'i18next';

export type FromLoaderFn = () => Promise<Form<string>>;

export interface Example {
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  form: Form<string> | FromLoaderFn;
  resources: Resource;
  onFormEvent?: (event: FormEvent) => void;
}
