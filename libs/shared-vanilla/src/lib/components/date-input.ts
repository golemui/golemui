import { html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers';

@customElement('gui-date-control')
export class GuiDateControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) touched = false;
  @property({ type: Array }) errors = [];
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String }) icon = '';

  @state() private _day = '';
  @state() private _month = '';
  @state() private _year = '';

  private readonly MIN_DAY = 1;
  private readonly MAX_DAY = 31;
  private readonly MAX_VALID_DAY = (month: number, year: number) => {
    if (month === 2) {
      const isLeapYear = new Date(year, 1, 29).getDate() === 29;
      return isLeapYear || !year ? 29 : 28;
    } else if (month === 4 || month === 6 || month === 9 || month === 11) {
      return 30;
    }
    return 31;
  };
  private readonly MIN_MONTH = 1;
  private readonly MAX_MONTH = 12;
  private readonly MIN_YEAR = 1000;
  private readonly MAX_YEAR = 9999;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.gui-date-input`),
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

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this.parseValue(this.value ?? '');
    }
  }

  override render() {
    const parts = new Intl.DateTimeFormat(this.localeId, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());

    const iconClassMap = {
      'gui-field-icon': true,
      [this.icon]: true,
    };

    return html`
      <div class="gui-date-input ${this.icon ? 'gui-calendar--icon' : nothing}" role="group">
        ${repeat(
          parts,
          (part: any) => part.type,
          (part: any, index: number) => {
            const tabIndex = index === 0 ? 0 : -1;

            switch (part.type) {
              case 'day':
                return this.renderInput('day', 'dd', 2, tabIndex, this._day);
              case 'month':
                return this.renderInput('month', 'mm', 2, tabIndex, this._month);
              case 'year':
                return this.renderInput('year', 'yyyy', 4, tabIndex, this._year);
              case 'literal':
                return html`<span class="gui-date-input__separator">${part.value}</span>`;
              default:
                return '';
            }
          },
        )}
      </div>
      ${this.icon ? html`<span class=${classMap(iconClassMap)}></span>` : nothing}
    `;
  }

  private renderInput(
    type: 'day' | 'month' | 'year',
    placeholder: string,
    maxLen: number,
    tabIndex: number,
    val: string,
  ) {
    return html`
      <input
        type="text"
        inputmode="numeric"
        class="gui-date-input__part ${type === 'year' ? 'gui-year-input__year' : ''}"
        data-type="${type}"
        maxlength="${maxLen}"
        placeholder="${placeholder}"
        tabindex="${tabIndex}"
        ?disabled="${this.disabled}"
        ?readonly="${this.readonly}"
        .value="${live(val)}"
        @keydown="${this.handleKeyDown}"
        @keyup="${(e: KeyboardEvent) => this.handleKeyUp(e, type)}"
        @focus="${this.handleFocus}"
        @blur="${(e: FocusEvent) => this.handleBlur(e, type)}"
        @change="${(e: Event) => this.handleChange(e, type)}"
      />
    `;
  }

  private parseValue(isoValue: string | null) {
    if (!isoValue) {
      this._day = '';
      this._month = '';
      this._year = '';
      return;
    }
    const date = new Date(isoValue);
    if (!isNaN(date.getTime())) {
      this._day = date.getDate().toString().padStart(2, '0');
      this._month = (date.getMonth() + 1).toString().padStart(2, '0');
      this._year = date.getFullYear().toString();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Enter',
    ];

    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private handleFocus(event: FocusEvent) {
    this.dispatchEvent(new CustomEvent('focus', { detail: event }));
  }

  private handleKeyUp(event: KeyboardEvent, type: 'day' | 'month' | 'year') {
    const input = event.target as HTMLInputElement;
    const inputs = Array.from(this.querySelectorAll('input'));
    const index = inputs.indexOf(input);

    // We jump to the next input when the input is filled
    if (input.value.length === input.maxLength && /^[0-9]$/.test(event.key)) {
      if (index === inputs.length - 1) {
        inputs[0].focus();
      } else {
        inputs[index + 1].focus();
      }
    }

    switch (event.key) {
      case 'ArrowUp': {
        const value = isNaN(parseInt(input.value, 10) + 1) ? 1 : parseInt(input.value, 10) + 1;
        if (type === 'year') this._year = value.toString().padStart(4, '0');
        if (type === 'month') this._month = value.toString().padStart(2, '0');
        if (type === 'day') this._day = value.toString().padStart(2, '0');
        input.select();
        this.validateAndEmit();
        break;
      }
      case 'ArrowDown': {
        const value = isNaN(parseInt(input.value, 10) - 1) ? 1 : parseInt(input.value, 10) - 1;
        if (type === 'year') this._year = value.toString().padStart(4, '0');
        if (type === 'month') this._month = value.toString().padStart(2, '0');
        if (type === 'day') this._day = value.toString().padStart(2, '0');
        input.select();
        this.validateAndEmit();
        break;
      }
      case 'ArrowLeft':
        if (index > 0) {
          inputs[index - 1].focus();
          inputs[index - 1].select();
        }
        break;
      case 'ArrowRight':
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
          inputs[index + 1].select();
        }
        break;
    }
  }

  private handleChange(event: Event, type: 'day' | 'month' | 'year') {
    event.stopImmediatePropagation();

    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');

    switch (type) {
      case 'day':
        this._day = val;
        break;
      case 'month':
        this._month = val;
        break;
      case 'year':
        this._year = val;
        break;
    }

    this.validateAndEmit();
  }

  private handleBlur(event: FocusEvent, type: 'day' | 'month' | 'year') {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);

    if (!isNaN(val) && val > 0) {
      const length = type === 'year' ? 4 : 2;
      input.value = val.toString().padStart(length, '0');
    } else {
      this.dispatchEvent(new CustomEvent('change', { detail: { value: null } }));
    }

    this.dispatchEvent(new CustomEvent('blur'));
  }

  private validateAndEmit() {
    let yearVal = parseInt(this._year, 10);
    let monthVal = parseInt(this._month, 10);
    let dayVal = parseInt(this._day, 10);

    if (yearVal > this.MAX_YEAR) {
      yearVal = this.MAX_YEAR;
      this._year = yearVal.toString().padStart(4, '0');
    }
    if (yearVal < this.MIN_YEAR) {
      yearVal = this.MIN_YEAR;
      this._year = yearVal.toString().padStart(4, '0');
    }

    if (monthVal > this.MAX_MONTH) {
      monthVal = this.MAX_MONTH;
      this._month = monthVal.toString().padStart(2, '0');
    }
    if (monthVal < this.MIN_MONTH) {
      monthVal = this.MIN_MONTH;
      this._month = monthVal.toString().padStart(2, '0');
    }

    if (dayVal > this.MAX_DAY) {
      dayVal = this.MAX_DAY;
      this._day = dayVal.toString().padStart(2, '0');
    }
    if (dayVal < this.MIN_DAY) {
      dayVal = this.MIN_DAY;
      this._day = dayVal.toString().padStart(2, '0');
    }

    const isYearValid = !isNaN(yearVal) && String(yearVal).length === 4;
    const isMonthValid = !isNaN(monthVal) && monthVal > 0;
    const isDayValid = !isNaN(dayVal) && dayVal > 0;

    if (isDayValid && isMonthValid && isYearValid) {
      const maxValidDay = this.MAX_VALID_DAY(monthVal, yearVal);
      // Date is complete but invalid
      if (dayVal > maxValidDay) {
        // TODO: add property for i18n error messages
        this.dispatchEvent(
          new CustomEvent('inputError', {
            detail: {
              message:
                'Invalid date: day is greater than the maximum valid day for the month and year.',
            },
            bubbles: true,
          }),
        );
      } else {
        const currentDate = new Date(yearVal, monthVal - 1, dayVal);
        this.value = currentDate.toISOString();

        this.dispatchEvent(
          new CustomEvent('change', {
            detail: { value: this.value },
            bubbles: true,
          }),
        );
      }
    }

    this.requestUpdate();
  }
}
