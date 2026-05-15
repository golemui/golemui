import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';

const mock = AppsShared.tiny;

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef: Core.Form<string> | undefined;
  formData = mock.data;
  validateOn: Core.ValidateOn = 'eager';

  error = '';

  override createRenderRoot() {
    return this;
  }

  override async connectedCallback() {
    super.connectedCallback();
    const { form } = mock;
    this.formDef = typeof form === 'function' ? await form() : form;
    this.requestUpdate();
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}
        ${this.formDef
          ? html`<gui-form
              .config=${{ formDef: this.formDef, data: this.formData, validateOn: this.validateOn }}
            ></gui-form>`
          : null}
      </div>
    `;
  }
}
