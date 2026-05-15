import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

const md = AppsShared.modularDx;

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

  protected async onFormEvent(event: CustomEvent<Core.FormEvent>) {
    await AppsShared.onFormEvent(event.detail);
  }

  override render() {
    return html`
      <div>
        <gui-form .config=${config} @formEvent=${this.onFormEvent}></gui-form>
      </div>
    `;
  }
}
