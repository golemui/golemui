import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, ControlTemplateData } from '../utils/templates';
import { NumberinputProps } from '../field.props';

@customElement('gui-number')
export class GuiNumberControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Number }) value: number | undefined = undefined;

  @property({ type: Number }) step: number | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) iconPosition: 'left' | 'right' | undefined = 'left';
  @property({ type: String }) placeholder: string | undefined = undefined;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`input[id="${this.uid}"]`),
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

  override connectedCallback() {
    super.connectedCallback();
  }

  override render() {
    super.render();

    const templateData: ControlTemplateData<number> & NumberinputProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      touched: this.touched,
      errors: this.errors,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      step: this.step,
      icon: this.icon,
      iconPosition: this.iconPosition,
      placeholder: this.placeholder,
    };

    const fieldClasses: { [key: string]: boolean } = {
      [`gui-number--icon`]: !!this.icon,
      [`gui-number--icon-right`]: this.iconPosition === 'right',
    };

    const numberClasses = {
      'gui-field-icon': true,
      'gui-field-icon--right': this.iconPosition === 'right',
      [this.icon as string]: true,
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-field">
        <input
          type="number"
          inputmode="numeric"
          id=${this.uid}
          data-cy=${`${this.uid}_number`}
          class=${classMap(fieldClasses)}
          value=${this.value}
          ?disabled=${this.disabled || nothing}
          ?readonly=${this.readOnly || nothing}
          step=${typeof this.step === 'number' ? this.step : nothing}
          placeholder=${this.placeholder || nothing}
          @input="${() => this.valueChanged(event)}"
          @blur="${() => this.onBlur()}"
        />
        ${this.icon ? html`<div class=${classMap(numberClasses)}></div>` : nothing}
      </div>

      ${addErrors(this.uid as string, templateData)}
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

declare global {
  interface HTMLElementTagNameMap {
    'gui-number': GuiNumberControl;
  }
}
