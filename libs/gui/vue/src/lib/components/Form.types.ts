import type { FormEvent, FormHealth } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';

export interface GuiFormProps {
  config: GuiFormInitConfig;
  autocomplete?: string;
}

export type GuiFormEmits = {
  (e: 'form-event', event: FormEvent): void;
  (e: 'form-health', health: FormHealth): void;
};

export interface GuiFormHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}
