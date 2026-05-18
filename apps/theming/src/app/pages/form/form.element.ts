import { tiny } from '@golemui/apps-shared';
import type { ValidateOn } from '@golemui/core';
import '@golemui/gui-lit';
import { type GuiFormInitConfig } from '@golemui/gui-shared';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';

const mock = tiny;

@customElement('lit-form')
export class FormElement extends LitElement {
  config: GuiFormInitConfig | undefined;
  validateOn: ValidateOn = 'eager';

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

  setDefaultTheme() {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
  }

  setClayTheme() {
    document.documentElement.removeAttribute('style');
    document.documentElement.setAttribute('data-theme', 'clay');
  }

  setOverrideCSSVariables() {
    document.documentElement.removeAttribute('data-theme');
    this.updateGuiVariable('--gui-border-default', '#a855f7');
    this.updateGuiVariable('--gui-radius-md', '12px');
    this.updateGuiVariable(
      '--gui-intent-primary',
      'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)',
    );
    this.updateGuiVariable('--gui-color-neutral-50', '#9ccaff');
    this.updateGuiVariable('--gui-color-neutral-950', '#3f205c');
  }

  updateGuiVariable = (property: string, value: string): void => {
    document.documentElement.style.setProperty(property, value);
  };

  render() {
    return html`
      <section class="theming-container">
        <div class="theming-options">
          <div class="theming-option">
            <label>
              <input type="radio" name="theming" checked @click=${() => this.setDefaultTheme()} />
              <span>Default theme</span>
            </label>
            <pre>@import '@golemui/gui-components/styles/index.css';</pre>
          </div>

          <div class="theming-option">
            <label>
              <input type="radio" name="theming" @click=${() => this.setClayTheme()} />
              <span>Choose one of our available themes</span>
            </label>
            <pre>
@import '@golemui/gui-components/styles/index.css';
@import '@golemui/gui-components/styles/themes/clay.css';</pre
            >
          </div>

          <div class="theming-option">
            <label>
              <input type="radio" name="theming" @click=${() => this.setOverrideCSSVariables()} />
              <span>Override CSS variables and create your own theme</span>
            </label>
            <pre>
--gui-border-default: #a855f7;
--gui-radius-md: 12px;
--gui-intent-primary: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
--gui-color-neutral-50: #9ccaff;
--gui-color-neutral-950: #3f205c;</pre
            >
          </div>
        </div>

        <div class="theming-view">
          ${this.error ? html`<p class="error">${this.error}</p>` : null}
          ${this.config ? html`<gui-form .config=${this.config}></gui-form>` : null}
        </div>
      </section>
    `;
  }
}
