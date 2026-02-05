import { html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers';
import { addErrors, addIcon, addLabel, ControlTemplateData } from '../utils/templates';
import { CurrencyProps } from '../widget.props';

@customElement('gui-currency')
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
  @property({ type: String }) maximumFractionDigits: number | undefined = undefined;
  @property({ type: String }) minimumFractionDigits: number | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = undefined;
  @property({ type: String }) iconPosition: 'left' | 'right' | undefined = 'left';
  @property({ type: String }) placeholder: string | undefined = undefined;

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
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('value')) {
      if (document.activeElement !== this.inputElement) {
        this.displayValue = this.formatCurrency(this.value);
      }
    }
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
      value: this.value as number,
      currency: this.currency,
      maximumFractionDigits: this.maximumFractionDigits,
      minimumFractionDigits: this.minimumFractionDigits,
      icon: this.icon,
      iconPosition: this.iconPosition,
      placeholder: this.placeholder,
    };

    this.displayValue = this.formatCurrency(this.value);

    // Icon
    const currencyIcon = addIcon('currency', templateData);

    const fieldClasses: { [key: string]: boolean } = {
      [`gui-currency--icon`]: !!this.icon,
      [`gui-currency--icon-right`]: this.iconPosition === 'right',
    };

    return html`
      ${addLabel(this.uid as string, templateData)}

      <div class="gui-field">
        <input
          type="text"
          id=${this.uid}
          data-cy=${`${this.uid}_currency`}
          class=${classMap(fieldClasses)}
          .value=${this.value ?? ''}
          ?required=${this.disabled}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          placeholder=${this.placeholder || nothing}
          @beforeinput=${this.handleBeforeInput}
          @input=${this.handleInput}
          @focus=${this.handleFocus}
          @blur=${this.handleBlur}
        />
        <label
          for=${this.uid}
          class="gui-currency__format-value ${this.icon && this.iconPosition !== 'right'
            ? 'gui-currency__format-value--icon'
            : ''}"
          >${this.displayValue}</label
        >
        ${currencyIcon.html}
      </div>

      ${addErrors(this.uid as string, templateData)}
    `;
  }

  private handleBeforeInput(event: InputEvent) {
    if (!event.data && !event.inputType.startsWith('insert')) return;
    if (
      event.inputType === 'deleteContentBackward' ||
      event.inputType === 'deleteContentForward' ||
      this.readOnly
    ) {
      return;
    }

    const data = event.data;
    if (!data) return;

    const { decimal } = this.separators;

    if (data === '-') {
      const cursorStart = this.inputElement.selectionStart;
      const currentValue = this.inputElement.value;
      const isReplacing = (this.inputElement.selectionEnd || 0) - (cursorStart || 0) > 0;

      if (cursorStart !== 0 || (currentValue.includes('-') && !isReplacing)) {
        event.preventDefault();
      }
      return;
    }

    const allowedPattern = new RegExp(`[0-9\\${decimal}]`);

    if (!allowedPattern.test(data)) {
      event.preventDefault();
      return;
    }

    if (data === decimal && this.inputElement.value.includes(decimal)) {
      event.preventDefault();
    }
  }

  private handleInput(event: InputEvent) {
    event.stopPropagation();

    if (!this.readOnly) {
      const input = event.target as HTMLInputElement;
      const { decimal, group } = this.separators;

      let rawValueString = input.value.split(group).join('').replace(decimal, '.');

      if (rawValueString === `-.`) rawValueString = '-0.';

      this.value = isNaN(parseFloat(rawValueString)) ? null : parseFloat(rawValueString);
      this.displayValue = this.formatCurrency(this.value);

      this.dispatchEvent(
        new CustomEvent('input', {
          detail: { value: this.value },
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
      return new Intl.NumberFormat(this.localeId ?? 'en', {
        style: 'currency',
        currency: this.currency ?? 'USD',
        maximumFractionDigits:
          this.maximumFractionDigits ?? Math.max(this.minimumFractionDigits ?? 2, 2),
        minimumFractionDigits: this.minimumFractionDigits ?? 2,
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
