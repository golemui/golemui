import type {
  FormEvent,
  FormHealth,
  FormInitConfig,
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
  (e: 'form-event', event: FormEvent): void;
  (e: 'form-health', health: FormHealth): void;
};
