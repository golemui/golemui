import * as AppsShared from '@golemui/apps-shared';
import type * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';

const mock = AppsShared.tiny;

@customElement('lit-form')
export class FormElement extends LitElement {
  config: GuiFormInitConfig | undefined;
  validateOn: Core.ValidateOn = 'eager';

  error = '';

  override createRenderRoot() {
    return this;
  }

  override async connectedCallback() {
    super.connectedCallback();
    const { form } = mock;
    const formDef = typeof form === 'function' ? await form() : form;
    this.config = { formDef, data: mock.data, validateOn: this.validateOn };
    this.requestUpdate();
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}
        ${this.config ? html`<gui-form .config=${this.config}></gui-form>` : null}
      </div>
    `;
  }
}
