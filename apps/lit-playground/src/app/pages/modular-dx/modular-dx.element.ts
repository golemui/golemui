import { mockUploadService, modularDx, onFormEvent } from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import '@golemui/gui-lit';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import snarkdown from 'snarkdown';

const md = modularDx;

const dependencies: Dependencies = {
  markdown: { parse: (markdown: string) => snarkdown(markdown) },
  uploadService: mockUploadService,
};

const config: GuiFormInitConfig = {
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
  dependencies,
};

@customElement('lit-modular-dx')
export class ModularDxElement extends LitElement {
  private errors: string[] = [];

  override createRenderRoot() {
    return this;
  }

  private onFormEvent(event: CustomEvent<FormEvent>) {
    onFormEvent(event.detail);
  }

  private onFormSubmit(event: FormSubmitEvent) {
    console.log('👉 onFormSubmit', event.data);
  }

  private onFormHealth(event: FormHealth) {
    if (event.status === 'errored') {
      this.errors = [...this.errors, event.message];
    }
  }

  override render() {
    return html`
      <div>
        ${this.errors.length > 0
          ? html`<div
              style="border: 2px solid red; padding: 8px 12px; margin-bottom: 12px; color: red"
            >
              ${this.errors.toString()}
            </div>`
          : nothing}
        <gui-form
          .config=${config}
          @formEvent=${this.onFormEvent}
          @formSubmit=${this.onFormSubmit}
          @formHealth=${this.onFormHealth}
        ></gui-form>
      </div>
    `;
  }
}
