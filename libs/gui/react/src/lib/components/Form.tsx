import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import {
  createFormComponent,
  type FormComponentHandle,
  type FormHealthBoundary,
} from '@golemui/react';
import { type ForwardRefExoticComponent, type PropsWithoutRef, type RefAttributes } from 'react';
import { widgetLoaders } from '../widget.loaders';

export interface ReactFormComponentProps {
  config: GuiFormInitConfig;
  autocomplete?: string;
  formEvent?: (event: FormEvent) => void;
  formSubmit?: (event: FormSubmitEvent) => void;
  formHealth?: (formHealth: FormHealth) => void;
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary?: FormHealthBoundary;
}

// The explicit type annotation keeps the public GuiForm type expressed in
// gui's own prop names. The assignment fails to compile if these props ever
// drift from what the factory-built component accepts.
export const GuiForm: ForwardRefExoticComponent<
  PropsWithoutRef<ReactFormComponentProps> & RefAttributes<FormComponentHandle>
> = createFormComponent<GuiFormInitConfig>({
  widgetLoaders,
  validators: initValidators,
  resolveFormInput,
});

GuiForm.displayName = 'GuiForm';
