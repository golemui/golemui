import type { CurrencyProps } from '@golemui/gui-shared/internals';
import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { addErrors, addIcon, addLabel, type ControlTemplateData } from '../utils/templates';
import { blockNonNumericInput, blockNonNumericKeys, isRealNumber } from '../utils/numeric';

export class GuiCurrency extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: number | null | undefined = undefined;

  @property({ type: String }) currency: string | undefined = undefined;
  @property({ type: String }) step: number | undefined = undefined;
  @property({ type: String }) maximumFractionDigits: number | undefined = undefined;
  @property({ type: String }) minimumFractionDigits: number | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) placeholder: string | undefined = undefined;
  @property({ type: String }) autocomplete: string | undefined = undefined;

  @state() private displayValue: string | undefined;

  @query('input') inputElement!: HTMLInputElement;

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

  /**
   * The value as an actual number, or undefined. Property bindings bypass the
   * Lit converter, so consumers can hand us '', NaN or null; the String
   * converter additionally makes numeric strings legitimate on the attribute
   * path.
   */
  private get normalizedValue(): number | undefined {
    if (isRealNumber(this.value)) return this.value;
    if (typeof this.value === 'string' && this.value !== '') {
      const parsed = Number(this.value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  override willUpdate(changedProperties: PropertyValues) {
    const affectsFormat = [
      'value',
      'currency',
      'localeId',
      'maximumFractionDigits',
      'minimumFractionDigits',
    ].some((prop) => changedProperties.has(prop));
    if (affectsFormat && !this.inputElement?.matches(':focus')) {
      this.displayValue = this.formatCurrency(this.value);
    }
  }

  /**
   * Owns the native input value instead of a template binding, mirroring
   * gui-number: the comparison is numeric so a focused draft that parses to
   * the store value survives, and a focused input is left alone while typing.
   */
  private syncNativeInput(): void {
    const input = this.inputElement;
    if (!input || input.matches(':focus')) {
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

  override render() {
    super.render();

    const templateData: ControlTemplateData<number> & CurrencyProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.normalizedValue as number,
      currency: this.currency,
      maximumFractionDigits: this.maximumFractionDigits,
      minimumFractionDigits: this.minimumFractionDigits,
      icon: this.icon,
      placeholder: this.placeholder,
      autocomplete: this.autocomplete,
    };

    // Icon
    const currencyIcon = addIcon('currency', templateData);

    const fieldClasses: { [key: string]: boolean } = {
      'gui-widget-input': true,
      [`gui-currency--icon`]: !!this.icon,
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-widget">
        <input
          type="number"
          inputmode="decimal"
          id=${this.uid}
          data-cy=${`${this.uid}_currency`}
          class=${classMap(fieldClasses)}
          step=${this.step && this.step > 0 ? this.step : nothing}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          placeholder=${this.placeholder || nothing}
          autocomplete=${this.autocomplete || nothing}
          @input=${this.handleInput}
          @beforeinput=${blockNonNumericInput}
          @keydown=${blockNonNumericKeys}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        ${this.displayValue
          ? html`<span
              aria-hidden="true"
              class="gui-currency__format-value ${this.icon
                ? 'gui-currency__format-value--icon'
                : ''}"
              >${this.displayValue}</span
            >`
          : nothing}
        ${currencyIcon.html}
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  private handleInput(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const target = event.target as HTMLInputElement;
      this.displayValue = this.formatCurrency(target.valueAsNumber);

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

  private handleFocus() {
    this.displayValue = this.formatCurrency(this.value);
  }

  private handleBlur() {
    // Land any programmatic value the focus guard deferred while the user was
    // typing, before downstream listeners read the input.
    this.syncNativeInput();
    this.displayValue = this.formatCurrency(this.value);

    this.dispatchEvent(
      new CustomEvent('blur', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private formatCurrency(value: string | number | undefined | null): string {
    if (value === '' || value === undefined || value === null || isNaN(value as number)) return '';

    try {
      // Resolve max first, then clamp min so it never exceeds max — otherwise
      // e.g. `maximumFractionDigits: 0` with the default min of 2 would make
      // Intl.NumberFormat throw "maximumFractionDigits value is out of range".
      const maximumFractionDigits =
        this.maximumFractionDigits ?? Math.max(this.minimumFractionDigits ?? 2, 2);
      const minimumFractionDigits = Math.min(
        this.minimumFractionDigits ?? 2,
        maximumFractionDigits,
      );

      return new Intl.NumberFormat(this.localeId ?? 'en', {
        style: 'currency',
        currency: this.currency ?? 'USD',
        maximumFractionDigits,
        minimumFractionDigits,
      }).format(value as number);
    } catch (e) {
      console.warn('Invalid locale or currency', e);
      return value.toString();
    }
  }

  private get separators() {
    const example = new Intl.NumberFormat(this.localeId ?? 'en').format(1111.1);
    return {
      group: example.replace(/1/g, '').replace(/\d/g, '')[0] || ',',
      decimal: example.replace(/1/g, '').replace(/\d/g, '').slice(-1) || '.',
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-currency': GuiCurrency;
  }
}

safeDefine('gui-currency', GuiCurrency);
