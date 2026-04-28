import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import './app.element.scss';
import './pages/form/form.element';
import './pages/dx-form/dx-form.element';

@customElement('lit-root')
export class AppElement extends LitElement {
  public static observedAttributes = [];

  private readonly onHashChange = () => this.renderRoute();

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    this.renderRoute();
    window.addEventListener('hashchange', this.onHashChange);
  }

  override disconnectedCallback() {
    window.removeEventListener('hashchange', this.onHashChange);
  }

  private renderRoute() {
    const hash = window.location.hash.replace(/^#\/?/, '');
    let body: string;
    if (hash === 'json/kitchen-sink') {
      body = '<lit-form></lit-form>';
    } else if (hash === 'dx/kitchen-sink') {
      body = '<lit-dx-form></lit-dx-form>';
    } else {
      body = `
        <div style="padding: 2rem">
          <h1>Kitchen Sink</h1>
          <p>Pick a path:</p>
          <ul>
            <li><a href="#/json/kitchen-sink">JSON path</a></li>
            <li><a href="#/dx/kitchen-sink">DX path</a></li>
          </ul>
        </div>
      `;
    }
    this.innerHTML = `<main class="container">${body}</main>`;
  }
}
