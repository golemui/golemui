import { Component, signal } from '@angular/core';
import { mockUploadService, modularDx, onFormEvent } from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import { FormComponent } from '@golemui/gui-angular';
import type { Dependencies, GuiFormInitConfig } from '@golemui/gui-shared';
import snarkdown from 'snarkdown';

const formExample = modularDx;

const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
  uploadService: mockUploadService,
};

// Prerendered at build time (see vite.config.ts): the markup below is what the server
// wrote once, and the browser hydrates it like any request-rendered page.
@Component({
  imports: [FormComponent],
  selector: 'app-dx-modular-page',
  template: `
    <div>
      @if (error()) {
        <div style="border: 2px solid red; padding: 8px 12px; margin-bottom: 12px; color: red">
          {{ error() }}
        </div>
      }
      <gui-form
        [config]="config"
        (formEvent)="onFormEvent($event)"
        (formHealth)="onFormHealth($event)"
        (formSubmit)="onFormSubmit($event)"
      ></gui-form>
    </div>
  `,
})
export default class DxModularPage {
  protected readonly config: GuiFormInitConfig = {
    // Stable id: with SSR the server and client must agree on the form id.
    formName: 'analog-dx-modular',
    formDef: formExample.formDef,
    data: formExample.data,
    formSelectors: formExample.formSelectors,
    formConfig: formExample.formConfig,
    dependencies,
  };
  protected readonly error = signal('');

  protected onFormEvent(event: FormEvent) {
    onFormEvent(event);
  }

  protected onFormHealth(formHealth: FormHealth) {
    if (formHealth.status === 'errored') {
      this.error.set(formHealth.message);
    }
  }

  protected onFormSubmit(event: FormSubmitEvent) {
    console.log('👉 onFormSubmit', event.data);
  }
}
