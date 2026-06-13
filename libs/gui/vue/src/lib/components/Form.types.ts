import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import type { GuiFormInitConfig } from '@golemui/gui-shared';
import type { Component } from 'vue';

export interface GuiFormProps {
  config: GuiFormInitConfig;
  autocomplete?: string;
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary?: Component;
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
