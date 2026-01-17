import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app.element.scss';
import './pages/form/form.element';

@customElement('lit-root')
export class AppElement extends LitElement {
  public static observedAttributes = [];

  override createRenderRoot() {
    return this;
  }

  connectedCallback() {
    this.innerHTML = `
      <header class="header"><h1>GolemUI Lit</h1></header>
      <main class="main">
        <lit-form></lit-form>
      </main>
    `;
  }
}
