import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app.element.scss';
import './pages/form/form.element';
import { iframeResizer } from '@golemui/apps-shared';

@customElement('gui-theming')
export class AppElement extends LitElement {
  public static observedAttributes = [];

  override createRenderRoot() {
    return this;
  }

  connectedCallback() {
    iframeResizer();

    this.innerHTML = `
      <main class="container">
        <lit-form></lit-form>
      </main>
    `;
  }
}
