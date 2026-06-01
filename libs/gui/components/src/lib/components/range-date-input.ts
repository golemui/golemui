import { type DateRange, type RangeDateInputProps } from '@golemui/gui-shared';
import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { mergeDateRanges, toISODateString } from '../utils/date';
import { addErrors, addLabel, type ControlTemplateData } from '../utils/templates';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import { styleMap } from 'lit-html/directives/style-map.js';

interface DateParts {
  day: string;
  month: string;
  year: string;
}

@customElement('gui-range-date')
export class GuiRangeDateInput extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: Array }) value: DateRange[] | undefined = [];

  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String }) startDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) endDateAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;

  @state() private _startDate: DateParts = { day: '', month: '', year: '' };
  @state() private _endDate: DateParts = { day: '', month: '', year: '' };

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
    getTargets: () => this.querySelectorAll(`.gui-range-date-input`),
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
    const templateData: ControlTemplateData<DateRange[]> & RangeDateInputProps = {
      uid: this.uid,
      label: this.label,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      hint: this.hint,
    };

    const parts = new Intl.DateTimeFormat(this.localeId ?? 'en', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());

    const pills = this.getSortedPills();
    const pillItems: GuiPillItem[] = pills.map((pill) => {
      const startFormatted = this.formatDateForDisplay(pill.start);
      const endFormatted = pill.end ? this.formatDateForDisplay(pill.end) : startFormatted;
      const pillLabel = `${startFormatted} - ${endFormatted}`;
      return {
        key: `${pill.start}-${pill.end ?? pill.start}`,
        label: pillLabel,
        ariaLabel: `${this.removePillAriaLabel ?? 'Remove date'} ${pillLabel}`,
      };
    });

    const iconClassMap = {
      'gui-widget-icon': true,
      [this.icon as string]: !!this.icon,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, undefined, false) : nothing}

      <div class="gui-widget">
        <div
          class="gui-widget-input gui-range-date-input ${this.icon
            ? 'gui-range-date-input--icon'
            : ''}"
          role="group"
          aria-label=${this.label ?? 'Date range input'}
        >
          ${this.icon
            ? html`<span class=${classMap(iconClassMap)} data-icon=${this.icon}></span>`
            : nothing}

          <gui-pills
            class="gui-range-date-input__pills"
            style=${styleMap(pillItems.length ? {} : { 'min-width': 0 })}
            .items=${pillItems}
            .removable=${true}
            .clickable=${true}
            .bubble=${true}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date'}
            .compactAriaLabel=${`${pillItems.length} date ranges`}
            @pillremove=${this.onPillRemoveEvent}
            @pillclick=${this.onPillClickEvent}
          ></gui-pills>

          <div class="gui-range-date-input__inputs">
            <div
              class="gui-range-date-input__field"
              role="group"
              aria-label=${this.startDateAriaLabel ?? 'Start date'}
            >
              ${this.renderDateInputs('start', parts)}
            </div>

            <span class="gui-range-date-input__separator">${this.separator ?? '-'}</span>

            <div
              class="gui-range-date-input__field"
              role="group"
              aria-label=${this.endDateAriaLabel ?? 'End date'}
            >
              ${this.renderDateInputs('end', parts)}
            </div>
          </div>
        </div>

        ${this.showErrors && this.errors?.length
          ? addErrors(this.uid as string, templateData)
          : nothing}
      </div>
    `;
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const sorted = this.getSortedPills();
    const idx = sorted.findIndex(
      (pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key,
    );
    if (idx < 0) return;
    const removed = sorted[idx];
    const next = (this.value ?? []).filter(
      (pill) => !(pill.start === removed.start && (pill.end ?? null) === (removed.end ?? null)),
    );
    this.value = next;

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );

    if (next.length === 0) {
      requestAnimationFrame(() => {
        const firstInput = this.querySelector<HTMLInputElement>(
          '.gui-range-date-input__field input',
        );
        firstInput?.focus();
      });
    }
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const sorted = this.getSortedPills();
    const range = sorted.find((pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key);
    if (range) this.onPillClick(range);
  };

  private renderDateInputs(group: 'start' | 'end', parts: Intl.DateTimeFormatPart[]) {
    const dateParts = group === 'start' ? this._startDate : this._endDate;

    return repeat(
      parts,
      (part: Intl.DateTimeFormatPart) => `${group}-${part.type}`,
      (part: Intl.DateTimeFormatPart, index: number) => {
        const tabIndex = group === 'start' && index === 0 ? 0 : -1;

        switch (part.type) {
          case 'day':
            return this.renderInput(group, 'day', 'dd', 2, tabIndex, dateParts.day);
          case 'month':
            return this.renderInput(group, 'month', 'mm', 2, tabIndex, dateParts.month);
          case 'year':
            return this.renderInput(group, 'year', 'yyyy', 4, tabIndex, dateParts.year);
          case 'literal':
            return html`<span class="gui-range-date-input__separator">${part.value}</span>`;
          default:
            return '';
        }
      },
    );
  }

  private renderInput(
    group: 'start' | 'end',
    type: 'day' | 'month' | 'year',
    placeholder: string,
    maxLen: number,
    tabIndex: number,
    val: string,
  ) {
    return html`
      <div class="gui-range-date-input__touch-target">
        <input
          type="text"
          inputmode="numeric"
          class="gui-range-date-input__part ${type === 'year' ? 'gui-range-date-input__year' : ''}"
          data-type=${type}
          data-group=${group}
          maxlength=${maxLen}
          placeholder=${placeholder}
          tabindex=${tabIndex}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          autocomplete="off"
          .value=${live(val)}
          @keydown=${this.handleKeyDown}
          @keyup=${(e: KeyboardEvent) => this.handleKeyUp(e, group, type)}
          @focus=${this.handleFocus}
          @blur=${(e: FocusEvent) => this.handleBlur(e, group, type)}
          @change=${(e: Event) => this.handleChange(e, group, type)}
        />
        <div class="gui-range-date-input__visual-underline"></div>
      </div>
    `;
  }

  private formatDateForDisplay(isoDate: string): string {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat(this.localeId ?? 'en', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private getSortedPills(): DateRange[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return [...this.value].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }

  private onPillClick(range: DateRange) {
    this.dispatchEvent(
      new CustomEvent('pillClick', {
        detail: { range },
        bubbles: true,
        composed: true,
      }),
    );
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

    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey || this.readOnly) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private handleFocus(event: FocusEvent) {
    this.dispatchEvent(new CustomEvent('focus', { detail: event }));
  }

  private handleKeyUp(
    event: KeyboardEvent,
    group: 'start' | 'end',
    type: 'day' | 'month' | 'year',
  ) {
    if (this.readOnly) return;

    const isRTL = window.getComputedStyle(this).direction === 'rtl';
    const input = event.target as HTMLInputElement;
    const inputs = this.getGroupInputs(group);
    const index = inputs.indexOf(input);

    // Jump to next input when filled
    if (input.value.length === input.maxLength && /^[0-9]$/.test(event.key)) {
      if (index === inputs.length - 1) {
        // Last input of start group -> jump to first input of end group
        if (group === 'start') {
          const endInputs = this.getGroupInputs('end');
          if (endInputs.length > 0) {
            endInputs[0].focus();
          }
        }
        // Last input of end group -> try to create pill
      } else {
        inputs[index + 1].focus();
      }
    }

    switch (event.key) {
      case 'Enter': {
        this.tryCreatePill();
        if (this.value && this.value.length > 0) {
          const lastRange = this.value[this.value.length - 1];
          this.onPillClick(lastRange);
        }
        break;
      }
      case 'ArrowUp': {
        const value = isNaN(parseInt(input.value, 10) + 1) ? 1 : parseInt(input.value, 10) + 1;
        this.setDatePartValue(group, type, value);
        input.select();
        this.tryCreatePill();
        break;
      }
      case 'ArrowDown': {
        const value = isNaN(parseInt(input.value, 10) - 1) ? 1 : parseInt(input.value, 10) - 1;
        this.setDatePartValue(group, type, value);
        input.select();
        this.tryCreatePill();
        break;
      }
      case 'ArrowLeft': {
        const prevIdx = isRTL ? index + 1 : index - 1;
        if (prevIdx >= 0 && prevIdx < inputs.length) {
          inputs[prevIdx].focus();
          inputs[prevIdx].select();
        } else {
          const otherGroup = isRTL ? 'end' : 'start';
          if (group !== otherGroup) {
            const otherInputs = this.getGroupInputs(otherGroup);
            if (otherInputs.length > 0) {
              const target = otherInputs[otherInputs.length - 1];
              target.focus();
              target.select();
            }
          }
        }
        break;
      }
      case 'ArrowRight': {
        const nextIdx = isRTL ? index - 1 : index + 1;
        if (nextIdx >= 0 && nextIdx < inputs.length) {
          inputs[nextIdx].focus();
          inputs[nextIdx].select();
        } else {
          const otherGroup = isRTL ? 'start' : 'end';
          if (group !== otherGroup) {
            const otherInputs = this.getGroupInputs(otherGroup);
            if (otherInputs.length > 0) {
              otherInputs[0].focus();
              otherInputs[0].select();
            }
          }
        }
        break;
      }
    }
  }

  private handleChange(event: Event, group: 'start' | 'end', type: 'day' | 'month' | 'year') {
    event.stopImmediatePropagation();

    if (this.readOnly) return;

    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/[^0-9]/g, '');

    this.updateDatePart(group, type, val);
    this.tryCreatePill();
  }

  private handleBlur(event: FocusEvent, group: 'start' | 'end', type: 'day' | 'month' | 'year') {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);

    if (!isNaN(val) && val > 0) {
      const length = type === 'year' ? 4 : 2;
      input.value = val.toString().padStart(length, '0');
    }

    this.dispatchEvent(new CustomEvent('blur'));
  }

  private getGroupInputs(group: 'start' | 'end'): HTMLInputElement[] {
    return Array.from(this.querySelectorAll<HTMLInputElement>(`input[data-group="${group}"]`));
  }

  private setDatePartValue(group: 'start' | 'end', type: 'day' | 'month' | 'year', value: number) {
    const dateParts = group === 'start' ? this._startDate : this._endDate;
    const padLen = type === 'year' ? 4 : 2;

    if (type === 'day') dateParts.day = value.toString().padStart(padLen, '0');
    if (type === 'month') dateParts.month = value.toString().padStart(padLen, '0');
    if (type === 'year') dateParts.year = value.toString().padStart(padLen, '0');

    if (group === 'start') {
      this._startDate = { ...dateParts };
    } else {
      this._endDate = { ...dateParts };
    }
  }

  private updateDatePart(group: 'start' | 'end', type: 'day' | 'month' | 'year', val: string) {
    if (group === 'start') {
      this._startDate = { ...this._startDate, [type]: val };
    } else {
      this._endDate = { ...this._endDate, [type]: val };
    }
  }

  private validateDateParts(parts: DateParts): Date | null {
    let yearVal = parseInt(parts.year, 10);
    let monthVal = parseInt(parts.month, 10);
    let dayVal = parseInt(parts.day, 10);

    if (isNaN(yearVal) || isNaN(monthVal) || isNaN(dayVal)) return null;
    if (String(yearVal).length < 4) return null;

    // Clamp values
    yearVal = Math.max(this.MIN_YEAR, Math.min(this.MAX_YEAR, yearVal));
    monthVal = Math.max(this.MIN_MONTH, Math.min(this.MAX_MONTH, monthVal));
    dayVal = Math.max(this.MIN_DAY, Math.min(this.MAX_DAY, dayVal));

    const maxValidDay = this.MAX_VALID_DAY(monthVal, yearVal);
    if (dayVal > maxValidDay) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: {
            message:
              'Invalid date: day is greater than the maximum valid day for the month and year.',
          },
          bubbles: true,
        }),
      );
      return null;
    }

    return new Date(yearVal, monthVal - 1, dayVal);
  }

  private tryCreatePill() {
    const startDate = this.validateDateParts(this._startDate);
    const endDate = this.validateDateParts(this._endDate);

    if (!startDate || !endDate) return;

    let rangeStart = startDate;
    let rangeEnd = endDate;

    // Swap if end < start
    if (endDate.getTime() < startDate.getTime()) {
      rangeStart = endDate;
      rangeEnd = startDate;
    }

    const startStr = toISODateString(rangeStart);
    const endStr = toISODateString(rangeEnd);
    const newRange: DateRange =
      startStr === endStr ? { start: startStr } : { start: startStr, end: endStr };

    const currentRanges = this.value ? [...this.value] : [];
    currentRanges.push(newRange);

    this.value = mergeDateRanges(currentRanges);

    // Clear the inputs
    this._startDate = { day: '', month: '', year: '' };
    this._endDate = { day: '', month: '', year: '' };

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );

    // Focus the first start date input
    requestAnimationFrame(() => {
      const startInputs = this.getGroupInputs('start');
      if (startInputs.length > 0) {
        startInputs[0].focus();
      }
    });

    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-input': GuiRangeDateInput;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date')) {
  customElements.define('gui-range-date', GuiRangeDateInput);
}
