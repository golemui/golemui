import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addLabel } from '../utils/templates';

@customElement('gui-label')
export class GuiLabel extends LitElement {
  @property({ type: Object }) targetElement: HTMLElement[] | HTMLElement | undefined = undefined;
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) native: boolean | undefined = true;

  private ariaController = new GUIAriaController(this, {
    getTargets: () =>
      Array.isArray(this.targetElement)
        ? [...this.targetElement]
        : [this.targetElement as HTMLElement],
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override render() {
    super.render();

    return html`${addLabel(
      this.uid as string,
      {
        label: this.label,
        hint: this.hint,
        required: this.required,
        errors: this.errors,
        touched: this.touched,
      },
      false,
      undefined,
      this.native,
    )}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-label': GuiLabel;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-label')) {
  customElements.define('gui-label', GuiLabel);
}
