import * as Core from '@golemui/core';
import { defineForm } from '@golemui/core';
import '@golemui/lit-vanilla';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app.element.scss';

@customElement('gui-material')
export class AppElement extends LitElement {
  formDef = defineForm({
    form: [
      {
        uid: '',
        kind: 'input',
        type: 'matTextInput',
        label: 'Email',
        path: 'user.email',
        validator: { type: 'string', required: true, format: 'email' },
      },
      {
        uid: '',
        kind: 'input',
        type: 'matTextInput',
        label: 'Password',
        path: 'user.password',
        props: { type: 'password' },
      },
      {
        uid: 'btn-submit',
        kind: 'action',
        type: 'matButton',
        on: {
          click: 'handleSubmit',
        },
        label: 'Send',
      },
    ],
  });
  formData = {};
  customWidgetLoaders = {
    matTextInput: async () => (await import('./components/mat-input')).MatTextInputElement,
    matButton: async () => (await import('./components/mat-button')).MatButtonElement,
  };
  validateOn: Core.ValidateOn = 'eager';

  error = '';

  override createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}

        <gui-form
          .formDef=${this.formDef}
          .data=${this.formData}
          .widgetLoaders=${this.customWidgetLoaders}
          .validateOn=${this.validateOn}
        ></gui-form>
      </div>
    `;
  }
}
