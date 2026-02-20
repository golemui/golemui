import * as AppsShared from '@golemui/apps-shared';
import * as Core from '@golemui/core';
import '@golemui/lit-vanilla';
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
    this.updateGuiVariable('--gui-color-border', '#fff');
  }

  setCustomCSSFile() {
    this.updateGuiVariable('--gui-color-border', 'blue');
    this.updateGuiVariable('--gui-radius', '0');
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
              <input type="radio" name="theming" @click=${() => this.setGolemUITheme()} />
              <span>Use our GolemUI Theme</span>
            </label>
            <pre>@import '@golemui/themes/dist/golemui-theme.css';</pre>
          </div>

          <div class="theming-option">
            <label>
              <input type="radio" name="theming" @click=${() => this.setOverrideCSSVariables()} />
              <span>Override GolemUI styles with CSS Variables</span>
            </label>
            <pre>--gui-color-border: #fff;</pre>
          </div>

          <div class="theming-option">
            <label>
              <input type="radio" name="theming" @click=${() => this.setCustomCSSFile()} />
              <span>Create an entire new CSS file that fits perfectly for your needs</span>
            </label>
            <pre>
gui-textinput {
  display: block;

  .gui-widget {
    input[type='text'] {
      &.gui-textinput--icon {
        padding-inline-start: 2.5rem;
      }
    }
  }
}
            </pre
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
