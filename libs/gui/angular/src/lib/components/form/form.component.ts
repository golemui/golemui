import { CommonModule } from '@angular/common';
import { Component, input, output, type Type, viewChild } from '@angular/core';
import { type AngularWidgetSet, provideWidgetSet, WidgetSetFormComponent } from '@golemui/angular';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { resolveFormInput } from '@golemui/gui-shared/internals';
import { initValidators } from '@golemui/gui-validators';
import { widgetLoaders } from '../../widget.loaders';

// The gui widget set: loaders, validators, and the implementation-bound form
// input resolver. The generic WidgetSetFormComponent reads it through
// dependency injection and applies the shared merge precedence rules.
const guiWidgetSet: AngularWidgetSet<GuiFormInitConfig> = {
  widgetLoaders,
  validators: initValidators,
  resolveFormInput,
};

@Component({
  imports: [CommonModule, WidgetSetFormComponent],
  selector: 'gui-form',
  providers: [provideWidgetSet(guiWidgetSet)],
  templateUrl: './form.component.html',
})
export class FormComponent {
  config = input.required<GuiFormInitConfig>();
  autocomplete = input<string | undefined>(undefined);
  /** Wraps the form and renders the error UI for an errored FormHealth. Defaults to a red banner. */
  formHealthBoundary = input<Type<unknown> | undefined>(undefined);

  private innerForm = viewChild(WidgetSetFormComponent);

  formHealth = output<FormHealth>();
  formEvent = output<FormEvent>();
  formSubmit = output<FormSubmitEvent>();

  setData(data: Record<string, any>): void {
    this.innerForm()?.setData(data);
  }

  setMeta(meta: Record<string, any>): void {
    this.innerForm()?.setMeta(meta);
  }
}
