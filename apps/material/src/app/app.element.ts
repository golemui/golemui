import { iframeResizer } from '@golemui/apps-shared';
import type * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app.element.scss';

@customElement('gui-material')
export class AppElement extends LitElement {
  // TODO: Migrate to the gui.* DSL
  config: GuiFormInitConfig = {
    formDef: {
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
    },
    data: {},
    customWidgetLoaders: {
      matTextInput: async () => (await import('./components/mat-input')).MatTextInputElement,
      matButton: async () => (await import('./components/mat-button')).MatButtonElement,
    },
    validateOn: 'eager' as Core.ValidateOn,
  };

  error = '';

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    iframeResizer();
  }

  render() {
    return html`
      <div>
        ${this.error ? html`<p class="error">${this.error}</p>` : null}

        <gui-form .config=${this.config}></gui-form>
      </div>
    `;
  }
}
