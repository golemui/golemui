import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

export interface GuiFormProps {
  config: GuiFormInitConfig;
  autocomplete?: string;
}

export type GuiFormEmits = {
  'form-event': [event: FormEvent];
  'form-submit': [event: FormSubmitEvent];
  'form-health': [health: FormHealth];
};

export interface GuiFormHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}
