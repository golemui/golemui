import { mockMarkdownParser, mockUploadService, onFormEvent, signup } from '@golemui/apps-shared';
import type { FormEvent, FormHealth, FormSubmitEvent } from '@golemui/core';
import '@golemui/gui-lit';
import { type Dependencies, type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

const dependencies: Dependencies = {
  markdown: mockMarkdownParser,
  uploadService: mockUploadService,
};

const config: GuiFormInitConfig = {
  formDef: signup.form,
  data: signup.data,
  dependencies,
};

@customElement('lit-signup')
export class SignupElement extends LitElement {
  private errors: string[] = [];

  override createRenderRoot() {
    return this;
  }

  private onFormEvent(event: CustomEvent<FormEvent>) {
    onFormEvent(event.detail);
  }

  private onFormSubmit(event: CustomEvent<FormSubmitEvent>) {
    console.log('👉 onFormSubmit', event.detail.data);
  }

  private onFormHealth(event: CustomEvent<FormHealth>) {
    if (event.detail.status === 'errored') {
      this.errors = [...this.errors, event.detail.message];
      // `errors` is a plain field, so Lit does not render again without this call.
      this.requestUpdate();
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
