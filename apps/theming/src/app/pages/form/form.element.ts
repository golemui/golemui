import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/gui-lit';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './form.element.scss';

const mock = AppsShared.tiny;

@customElement('lit-form')
export class FormElement extends LitElement {
  formDef = mock.form;
  formData = mock.data;
  validateOn: Core.ValidateOn = 'eager';

  error = '';

  override createRenderRoot() {
    return this;
  }

  setGolemUITheme() {
    document.documentElement.removeAttribute('style');
  }

  setOverrideCSSVariables() {
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
              <input type="radio" name="theming" checked @click=${() => this.setGolemUITheme()} />
              <span>Use one of our GolemUI Themes</span>
            </label>
            <pre>
@import '@golemui/gui-components/styles/index.css';
@import '@golemui/gui-components/styles/themes/clay.css';</pre
            >
          </div>

          <div class="theming-option">
            <label>
              <input type="radio" name="theming" @click=${() => this.setOverrideCSSVariables()} />
              <span>Override GolemUI styles with CSS Variables</span>
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
          <gui-form
            .formDef=${this.formDef}
            .data=${this.formData}
            .validateOn=${this.validateOn}
          ></gui-form>
        </div>
      </section>
    `;
  }
}
