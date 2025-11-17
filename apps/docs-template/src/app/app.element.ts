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

  render() {
    this.innerHTML = `<lit-form></lit-form>`;
  }
}
