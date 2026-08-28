import { type ExpressionFunctions, type Form, type FormEvent } from '@golemui/core';
import { type Resource } from 'i18next';

export interface Example {
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
  /** A plain form definition object, loadable in the browser and in plain Node. */
  form: Form<string>;
  resources: Resource;
  onFormEvent?: (event: FormEvent) => void;
  functions?: ExpressionFunctions;
}
