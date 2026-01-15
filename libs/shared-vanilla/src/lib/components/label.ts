import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { addLabel } from '../utils/templates';
import { GUIAriaController } from '../controllers';

@customElement('gui-label')
export class GuiLabel extends LitElement {
  @property({ type: Object }) ariaTarget: HTMLElement | undefined = undefined;
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Boolean }) touched: boolean | undefined = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => [this.ariaTarget as HTMLElement],
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

    return html`${addLabel(this.uid as string, {
      label: this.label,
      hint: this.hint,
      required: this.required,
      errors: this.errors,
      touched: this.touched,
    })}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-label': GuiLabel;
  }
}
