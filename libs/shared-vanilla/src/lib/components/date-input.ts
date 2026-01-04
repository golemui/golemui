import { html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('gui-date-control')
export class GuiDateControl extends LitElement {
  @property({ type: String }) value: string | null = null;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  @property({ type: String }) icon = '';

  @state() private _day = '';
  @state() private _month = '';
  @state() private _year = '';

  private readonly MIN_YEAR = 1000;
  private readonly MAX_YEAR = 9999;

  override createRenderRoot() {
    return this;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      this.parseValue(this.value);
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
      <div
        class="gui-date-input ${this.icon ? 'gui-calendar--icon' : nothing}"
        role="group"
        @click="${this.focusFirstInput}"
      >
        ${repeat(
          parts,
          (part: any) => part.type,
          (part: any, index: number) => {
            const tabIndex = index === 0 ? 0 : -1;

            switch (part.type) {
              case 'day':
                return this.renderInput('day', 'dd', 2, tabIndex);
              case 'month':
                return this.renderInput('month', 'mm', 2, tabIndex);
              case 'year':
                return this.renderInput('year', 'yyyy', 4, tabIndex);
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
  ) {
    let val = '';
    if (type === 'day') val = this._day;
    else if (type === 'month') val = this._month;
    else if (type === 'year') val = this._year;

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
        @keyup="${this.handleKeyUp}"
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

  private focusFirstInput() {
    if (this.disabled) return;
    const first = this.querySelector('input');
    first?.focus();
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

  private handleKeyUp(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const inputs = Array.from(this.querySelectorAll('input'));
    const index = inputs.indexOf(input);

    if (input.value.length === input.maxLength && /^[0-9]$/.test(event.key)) {
      if (index < inputs.length - 1) inputs[index + 1].focus();
    }

    switch (event.key) {
      case 'ArrowUp':
        this.incrementValue(input, 1);
        break;
      case 'ArrowDown':
        this.incrementValue(input, -1);
        break;
      case 'ArrowLeft':
        if (input.selectionStart === 0 && index > 0) {
          inputs[index - 1].focus();
          inputs[index - 1].select();
        }
        break;
      case 'ArrowRight':
        if (input.selectionStart === input.value.length && index < inputs.length - 1) {
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

    if (type === 'day') this._day = val;
    if (type === 'month') this._month = val;
    if (type === 'year') this._year = val;

    this.validateAndEmit();
  }

  private handleBlur(event: FocusEvent, type: 'day' | 'month' | 'year') {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);

    if (!isNaN(val) && val > 0) {
      const length = type === 'year' ? 4 : 2;
      const padded = val.toString().padStart(length, '0');

      if (type === 'day') this._day = padded;
      if (type === 'month') this._month = padded;
      if (type === 'year') this._year = padded;

      input.value = padded;
    } else {
      if (input.value === '') {
        this.dispatchEvent(new CustomEvent('change', { detail: { value: null } }));
      }
    }

    this.validateAndEmit();
  }

  private incrementValue(input: HTMLInputElement, delta: number) {
    let val = parseInt(input.value, 10);
    if (isNaN(val)) val = delta > 0 ? 0 : 2;

    val += delta;
    input.value = val.toString().padStart(input.maxLength, '0');
    input.dispatchEvent(new Event('input'));
    input.select();
  }

  private validateAndEmit() {
    const d = parseInt(this._day, 10);
    const m = parseInt(this._month, 10);
    const y = parseInt(this._year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y)) return;
    if (this._year.length < 4) return;

    const finalY = Math.max(this.MIN_YEAR, Math.min(this.MAX_YEAR, y));
    const finalM = Math.max(1, Math.min(12, m));
    const maxDays = this.getMaxDays(finalM, finalY);
    const finalD = Math.max(1, Math.min(maxDays, d));

    if (finalD !== d || finalM !== m || finalY !== y) {
      this._day = finalD.toString().padStart(2, '0');
      this._month = finalM.toString().padStart(2, '0');
      this._year = finalY.toString().padStart(4, '0');
      this.requestUpdate();
    }

    const date = new Date(finalY, finalM - 1, finalD);
    date.setHours(12, 0, 0, 0);
    const iso = date.toISOString();

    if (this.value !== iso) {
      this.value = iso;
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: iso },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private getMaxDays(month: number, year: number): number {
    if (month === 2) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? 29 : 28;
    }
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
  }
}
