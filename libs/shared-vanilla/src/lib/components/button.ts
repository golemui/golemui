import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('gui-button')
export class ButtonControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) disabled = false;

  override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <div class="gui-field">
        <button
          type="button"
          id=${this.uid}
          data-cy=${`${this.uid}_button`}
          disabled=${this.disabled ? true : nothing}
        >
          ${this.label}
        </button>
      </div>
    `;
  }
}
