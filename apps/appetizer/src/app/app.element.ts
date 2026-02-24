import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app.element.scss';
import './pages/form/form.element';

@customElement('gui-appetizer')
export class AppElement extends LitElement {
  public static observedAttributes = [];

  override createRenderRoot() {
    return this;
  }

  connectedCallback() {
    this.innerHTML = `
      <main class="container">
        <lit-form></lit-form>
      </main>
    `;
  }
}
