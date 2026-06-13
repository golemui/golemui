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
  /** Wraps the form (received as its default slot) and renders the error UI for an errored {@link FormHealth} via a `health` prop. Defaults to a red banner. */
  formHealthBoundary?: Component<FormHealthBoundaryProps>;
}

/** Props a {@link FormComponentProps.formHealthBoundary} component receives. */
export interface FormHealthBoundaryProps {
  health: FormHealth;
}

export type FormComponentEmits = {
  'form-event': [event: FormEvent];
  'form-submit': [event: FormSubmitEvent];
  'form-health': [health: FormHealth];
};
