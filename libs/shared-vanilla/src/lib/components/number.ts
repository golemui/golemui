import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';

@customElement('gui-number-control')
export class NumberControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) touched = false;
  @property({ type: Array }) errors = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: Number }) step: number | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) iconPosition: 'left' | 'right' = 'left';
  @property({ type: String }) placeholder: string | undefined = undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
    getState: () => ({
      uid: this.uid as string,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readonly,
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

    const fieldClasses: { [key: string]: boolean } = {
      [`gui-number--icon`]: !!this.icon,
      [`gui-number--icon-right`]: this.iconPosition === 'right',
    };

    return html`
      <input
        type="number"
        inputmode="numeric"
        id=${this.uid}
        data-cy=${`${this.uid}_number`}
        class=${classMap(fieldClasses)}
        value=${this.value}
        ?disabled=${this.disabled || nothing}
        ?readonly=${this.readonly || nothing}
        step=${typeof this.step === 'number' ? this.step : nothing}
        placeholder=${this.placeholder || nothing}
        @input="${() => this.valueChanged(event)}"
        @blur="${() => this.onBlur()}"
      />
    `;
  }

  valueChanged(event: Event | undefined) {
    event?.stopPropagation();
    const target = event?.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: target.valueAsNumber },
        bubbles: true,
        composed: true,
      }),
    );
  }

  onBlur() {
    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}
