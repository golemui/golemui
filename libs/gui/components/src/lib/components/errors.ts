import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addErrors } from '../utils/templates';

@customElement('gui-errors')
export class GuiErrors extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    return html`${addErrors(this.uid as string, {
      touched: this.touched,
      errors: this.errors,
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-errors': GuiErrors;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-errors')) {
  customElements.define('gui-errors', GuiErrors);
}
