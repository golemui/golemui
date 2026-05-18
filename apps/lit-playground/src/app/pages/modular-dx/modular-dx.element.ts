import { modularDx, onFormEvent } from '@golemui/apps-shared'
import type { FormEvent } from '@golemui/core'
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

const md = modularDx;

const config: GuiFormInitConfig = {
  formDef: md.formDef,
  data: md.data,
  formSelectors: md.formSelectors,
  formConfig: md.formConfig,
};

@customElement('lit-modular-dx')
export class ModularDxElement extends LitElement {
  override createRenderRoot() {
    return this;
  }

  protected async onFormEvent(event: CustomEvent<FormEvent>) {
    await onFormEvent(event.detail);
  }

  override render() {
    return html`
      <div>
        <gui-form .config=${config} @formEvent=${this.onFormEvent}></gui-form>
      </div>
    `;
  }
}
