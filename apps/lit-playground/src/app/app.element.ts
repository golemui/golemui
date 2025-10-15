import './pages/form/form.element';
import './app.element.scss';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    this.innerHTML = `
      <header><h1>Formforge</h1></header>
      <main class="container">
        <lit-form></lit-form>
      </main>
    `;
  }
}
customElements.define('lit-root', AppElement);
