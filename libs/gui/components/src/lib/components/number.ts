import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import type { NumberinputProps } from '@golemui/gui-shared/internals';
import { styleMap } from 'lit-html/directives/style-map.js';

@customElement('gui-number')
export class GuiNumber extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Number }) value: number | undefined = undefined;

  @property({ type: Number }) step: number | undefined = undefined;
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) autocomplete: string | undefined = undefined;
  @property({ type: Number }) minimum: number | undefined = undefined;
  @property({ type: Number }) maximum: number | undefined = undefined;
  @property({ type: Number }) autoGrow: boolean | undefined = false;

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
    this.classList.add('gui-field');
  }

  override render() {
    super.render();

    const inputElement = this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement;

    // TODO: Try to calculate this better, too many magic numbers
    const inputStyles: any = {
      'min-width': '23px',
    };

    if (this.autoGrow) {
      if (inputElement) {
        inputElement.style.width = '0px';
        const newWidth = Math.max(23, inputElement.scrollWidth);
        inputStyles.width = `${newWidth}px`;
        inputStyles.maxWidth = `${newWidth}px`;
        inputElement.style.width = '';
      } else {
        inputStyles.width = '47px';
      }
    }

    const templateData: ControlTemplateData<number> & NumberinputProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      step: this.step,
      placeholder: this.placeholder,
      autocomplete: this.autocomplete,
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-widget">
        <input
          type="number"
          inputmode="decimal"
          id=${this.uid}
          data-cy=${`${this.uid}_number`}
          class="gui-widget-input"
          style=${styleMap(inputStyles)}
          value=${this.value}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          step=${typeof this.step === 'number' ? this.step : nothing}
          placeholder=${this.placeholder || nothing}
          autocomplete=${this.autocomplete || nothing}
          @input=${this.valueChanged}
          @keydown=${this.keyDown}
          @blur=${this.onBlur}
        />
        <span class="gui-number__decoration">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
            <path
              d="M213.66,165.66a8,8,0,0,1-11.32,0L128,91.31,53.66,165.66a8,8,0,0,1-11.32-11.32l80-80a8,8,0,0,1,11.32,0l80,80A8,8,0,0,1,213.66,165.66Z"
            ></path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256">
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path>
          </svg>
        </span>
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  keyDown(event: KeyboardEvent) {
    event.stopPropagation();

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.plus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.minus();
        break;
    }
  }

  minus() {
    if (!this.readOnly) {
      const target = this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement;
      const step = typeof this.step === 'number' ? this.step : 1;
      let value =
        Number(target.valueAsNumber) || Number(target.valueAsNumber) === 0
          ? target.valueAsNumber - step
          : 1;

      value = Number(this.maximum) ? Math.min(value, this.maximum!) : value;
      value = Number(this.minimum) ? Math.max(value, this.minimum!) : value;

      target.valueAsNumber = value;
      this.value = value;

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  plus() {
    if (!this.readOnly) {
      const target = this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement;
      const step = typeof this.step === 'number' ? this.step : 1;
      let value =
        Number(target.valueAsNumber) || Number(target.valueAsNumber) === 0
          ? target.valueAsNumber + step
          : 1;

      value = Number(this.maximum) ? Math.min(value, this.maximum!) : value;
      value = Number(this.minimum) ? Math.max(value, this.minimum!) : value;

      target.valueAsNumber = value;
      this.value = value;

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  valueChanged(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      const value = target.valueAsNumber;
      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: Number.isNaN(value) ? undefined : value },
          bubbles: true,
          composed: true,
        }),
      );
    }
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
    'gui-number': GuiNumber;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-number')) {
  customElements.define('gui-number', GuiNumber);
}
