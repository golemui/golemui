import './pages/form/form.element';
import './app.element.scss';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('lit-root')
export class AppElement extends LitElement {
  public static observedAttributes = [];

  override createRenderRoot() {
    return this;
  }

  connectedCallback() {
    this.innerHTML = `
      <header><h1>Formforge</h1></header>
      <main class="container">
        <lit-form></lit-form>
      </main>
    `;
  }
}
