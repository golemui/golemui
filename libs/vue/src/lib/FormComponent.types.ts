import type {
  FormEvent,
  FormHealth,
  FormInitConfig,
  FormSubmitEvent,
  ValidatorFn,
  WithWidget,
} from '@golemui/core';
import type { Component } from 'vue';

export interface FormComponentHandle {
  setData: (data: Record<string, any>) => void;
  setMeta: (meta: Record<string, any>) => void;
}

export interface FormComponentProps {
  config: FormInitConfig<Component<WithWidget>>;
  validators: ValidatorFn<any>;
  autocomplete?: string;
}

export type FormComponentEmits = {
  'form-event': [event: FormEvent];
  'form-submit': [event: FormSubmitEvent];
  'form-health': [health: FormHealth];
};
