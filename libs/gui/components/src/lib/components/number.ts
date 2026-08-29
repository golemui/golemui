import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import { blockNonNumericInput, blockNonNumericKeys, isRealNumber } from '../utils/numeric';
import type { NumberinputProps } from '@golemui/gui-shared/internals';
import { styleMap } from 'lit-html/directives/style-map.js';
import { CARET_DOWN_PATH, CARET_UP_PATH } from '../utils/icons';

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
        required: this.required,
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

    // A server render has no querySelector on the element shim. The first client render
    // finds no input either, so both fall back to the same default width.
    const inputElement =
      typeof document === 'undefined'
        ? null
        : (this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement | null);

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
      value: this.normalizedValue,
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
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          step=${typeof this.step === 'number' ? this.step : nothing}
          min=${isRealNumber(this.minimum) ? this.minimum : nothing}
          max=${isRealNumber(this.maximum) ? this.maximum : nothing}
          placeholder=${this.placeholder || nothing}
          autocomplete=${this.autocomplete || nothing}
          @input=${this.valueChanged}
          @beforeinput=${blockNonNumericInput}
          @keydown=${this.keyDown}
          @blur=${this.onBlur}
        />
        <span class="gui-number__decoration">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path d=${CARET_UP_PATH}></path>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path d=${CARET_DOWN_PATH}></path>
          </svg>
        </span>
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  /**
   * The value as an actual number, or undefined. Property bindings bypass the
   * Lit converter, so arbitrary consumers can hand us '' (Angular-style ?? ''
   * templates), NaN (the Vue undefined workaround) or null.
   */
  private get normalizedValue(): number | undefined {
    return isRealNumber(this.value) ? this.value : undefined;
  }

  /**
   * Owns the native input value instead of a template binding. An attribute binding is
   * ignored once the user typed, and a string live() binding cannot express "equal as
   * numbers", so a draft like `1.` that already parses to the store value would be
   * clobbered mid-typing. The comparison is numeric so such a draft survives, and a
   * focused input is left alone while typing.
   */
  private syncNativeInput(): void {
    const input = this.querySelector(`input[id="${this.uid}"]`) as HTMLInputElement | null;
    if (input === null || input.matches(':focus')) {
      return;
    }
    const storeValue = this.normalizedValue;
    const shownValue = input.valueAsNumber;
    const bothEmpty = Number.isNaN(shownValue) && storeValue === undefined;
    const sameNumber = !Number.isNaN(shownValue) && shownValue === storeValue;
    if (bothEmpty || sameNumber) {
      return;
    }
    if (storeValue === undefined) {
      input.value = '';
    } else {
      input.valueAsNumber = storeValue;
    }
  }

  protected override updated(): void {
    this.syncNativeInput();
  }

  keyDown(event: KeyboardEvent) {
    event.stopPropagation();
    blockNonNumericKeys(event);

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

      value = isRealNumber(this.maximum) ? Math.min(value, this.maximum) : value;
      value = isRealNumber(this.minimum) ? Math.max(value, this.minimum) : value;

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

      value = isRealNumber(this.maximum) ? Math.min(value, this.maximum) : value;
      value = isRealNumber(this.minimum) ? Math.max(value, this.minimum) : value;

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
    // The focus guard in syncNativeInput() defers programmatic values while the
    // user is typing; land them now instead of relying on the blur dispatch to
    // coincidentally cause a store change and re-render.
    this.syncNativeInput();
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

safeDefine('gui-number', GuiNumber);
