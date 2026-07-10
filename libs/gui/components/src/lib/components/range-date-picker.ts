import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange } from '@golemui/gui-shared/internals';
import './range-date-input';
import './range-calendar';
import { dateBoundsError } from '../utils/date';
import { addErrors, addIcon, addLabel } from '../utils/templates';

@customElement('gui-range-date-picker')
export class GuiRangeDatePicker extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  @property({ type: Boolean }) touched: boolean | undefined = false;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) value: DateRange[] | undefined = [];
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'start-date-aria-label' }) startDateAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'end-date-aria-label' }) endDateAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'day-format' }) dayFormat:
    | 'numeric'
    | '2-digit'
    | undefined = undefined;
  @property({ type: String, attribute: 'weekday-format' }) weekdayFormat:
    | 'short'
    | 'long'
    | 'narrow'
    | undefined = undefined;
  @property({ type: String, attribute: 'month-format' }) monthFormat:
    | 'numeric'
    | '2-digit'
    | 'long'
    | 'short'
    | 'narrow'
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: DateRange[] | undefined =
    undefined;
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined =
    undefined;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;

  @query('#date-input') private _dateRef?: HTMLElement;
  @query('#calendar-input') private _calendarRef?: HTMLElement;

  @state() private _isCalendarOpen = false;
  @state() private _focusDate: string | undefined = undefined;

  private _ignoreNextFocusOut = false;
  private _focusOutRafId: number | undefined;
  private _restoringFocus = false;

  onDocumentClick = (event: MouseEvent) => {
    if (!this._isCalendarOpen) return;

    const path = event.composedPath();
    const clickedInsideDate = this._dateRef && path.includes(this._dateRef);
    const clickedInsideCalendar = this._calendarRef && path.includes(this._calendarRef);

    if (!clickedInsideDate && !clickedInsideCalendar) {
      this.closeCalendar();
    }
  };

  onFocusOut = (event: FocusEvent) => {
    if (this._ignoreNextFocusOut) {
      this._ignoreNextFocusOut = false;
      return;
    }
    if (!this._isCalendarOpen) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

    if (this._focusOutRafId !== undefined) {
      cancelAnimationFrame(this._focusOutRafId);
    }
    this._focusOutRafId = requestAnimationFrame(() => {
      this._focusOutRafId = undefined;
      if (!this.contains(document.activeElement)) {
        this.closeCalendar();
      }
    });
  };

  // Pills dropdown and the calendar are mutually exclusive, opening one closes the other
  onDropdownToggle = (event: Event) => {
    const detail = (event as CustomEvent<{ open: boolean }>).detail;
    if (detail?.open && this._isCalendarOpen) {
      this.closeCalendar();
    }
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.addEventListener('focusout', this.onFocusOut);
    this.addEventListener('dropdowntoggle', this.onDropdownToggle);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onDocumentClick);
    this.removeEventListener('focusout', this.onFocusOut);
    this.removeEventListener('dropdowntoggle', this.onDropdownToggle);
    if (this._focusOutRafId !== undefined) {
      cancelAnimationFrame(this._focusOutRafId);
    }
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._isCalendarOpen
      ? html`<gui-range-calendar
          id="calendar-input"
          .uid=${this.uid}
          .hint=${this.hint}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .value=${this.value}
          .focusDate=${this._focusDate}
          .prevMonthIcon=${this.prevMonthIcon}
          .nextMonthIcon=${this.nextMonthIcon}
          .prevMonthAriaLabel=${this.prevMonthAriaLabel}
          .nextMonthAriaLabel=${this.nextMonthAriaLabel}
          .dayFormat=${this.dayFormat}
          .weekdayFormat=${this.weekdayFormat}
          .monthFormat=${this.monthFormat}
          .minDate=${this.minDate}
          .maxDate=${this.maxDate}
          .disabledRanges=${this.disabledRanges}
          .numberOfMonths=${this.numberOfMonths}
          .localeId=${this.localeId}
          .hidePills=${true}
          @blur=${this.onCalendarBlur}
          @change=${this.onCalendarChange}
        ></gui-range-calendar>`
      : nothing;

    return html`
      ${addLabel(this.uid ?? '', {
        label: this.label,
        hint: this.hint,
        required: this.required,
      })}

      <div
        role="button"
        tabindex="-1"
        class="gui-widget"
        aria-expanded=${this._isCalendarOpen}
        @keyup=${this.onKeyUp}
        @keydown=${this.onKeyDown}
        @click=${this.toggleCalendar}
      >
        <gui-range-date
          id="date-input"
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .errors=${this.errors}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .value=${this.value}
          .icon=${this.icon}
          .localeId=${this.localeId}
          .separator=${this.separator}
          .removePillAriaLabel=${this.removePillAriaLabel}
          .startDateAriaLabel=${this.startDateAriaLabel}
          .endDateAriaLabel=${this.endDateAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          @blur=${this.onDateBlur}
          @focus=${this.openCalendar}
          @change=${this.onDateChange}
          @pillClick=${this.onPillClick}
        ></gui-range-date>
        <span class="gui-range-date-picker__arrow"
          ><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256">
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path></svg
        ></span>

        ${calendar}
      </div>

      ${this.showErrors
        ? addErrors(this.uid ?? '', { errors: this.errors, touched: this.touched })
        : ''}
    `;
  }

  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    this.commitValue(event.detail.value);
  }

  private onDateBlur() {
    this.dispatchEvent(new CustomEvent('blur'));
  }

  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    this.commitValue(event.detail.value);
  }

  private commitValue(value: DateRange[] | null | undefined) {
    this.value = value ?? undefined;
    const error = this.validateBounds(this.value);
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value ?? null },
        bubbles: true,
        composed: true,
      }),
    );
    if (error) {
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: { message: error },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private validateBounds(value: DateRange[] | undefined): string | null {
    if (!value || value.length === 0) return null;
    const messages = {
      minDateMessage: this.minDateMessage,
      maxDateMessage: this.maxDateMessage,
      disabledDateRangeMessage: this.disabledDateRangeMessage,
    };
    for (const range of value) {
      for (const endpoint of [range.start, range.end]) {
        if (!endpoint) continue;
        const error = dateBoundsError(
          endpoint,
          this.minDate,
          this.maxDate,
          this.disabledRanges,
          messages,
        );
        if (error) return error;
      }
    }
    return null;
  }

  private onCalendarBlur() {
    this.closeCalendar();
  }

  private onPillClick(event: CustomEvent) {
    this._focusDate = event.detail.range.start;
    this.openCalendar();
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      if (this._isCalendarOpen) this.closeCalendar();
      else this.openCalendar();
    }
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.key === 'Escape' && this._isCalendarOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.restoreFocusToInput();
      this.closeCalendar();
    }
  };

  private toggleCalendar = (event: Event) => {
    if (this.disabled) return;
    const target = event.target as HTMLElement;

    const isInputClick = target.closest('.gui-range-date-input__part');
    const isCalendarClick = target.closest('gui-range-calendar');
    if (isInputClick || isCalendarClick) {
      this.openCalendar();
    } else if (this._isCalendarOpen) {
      this.closeCalendar();
    } else {
      this.openCalendar();
    }
  };

  openCalendar = () => {
    if (this.disabled || this._restoringFocus) return;
    const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
    if (dropdownWasOpen) this._ignoreNextFocusOut = true;
    this.closePillsDropdown();
    if (!this._isCalendarOpen) {
      this._isCalendarOpen = true;
    }
  };

  closeCalendar() {
    this._isCalendarOpen = false;
  }

  private restoreFocusToInput() {
    const part = this.querySelector<HTMLElement>('gui-range-date input');
    if (!part) return;
    this._restoringFocus = true;
    part.focus();
    setTimeout(() => {
      this._restoringFocus = false;
    });
  }

  private closePillsDropdown() {
    const pills = this.querySelector('gui-pills') as
      | (HTMLElement & { closeDropdown?: () => void })
      | null;
    pills?.closeDropdown?.();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-picker': GuiRangeDatePicker;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date-picker')) {
  customElements.define('gui-range-date-picker', GuiRangeDatePicker);
}
