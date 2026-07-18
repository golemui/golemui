import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange } from '@golemui/gui-shared/internals';
import './range-date-input';
import type { GuiRangeDateInput } from './range-date-input';
import './range-calendar';
import { GUIPopupController } from '../controllers/popup.controller';
import { dateBoundsError, DISABLED_DATE_RANGE_MESSAGE, rangeSpansDisabledDay } from '../utils/date';
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

  @state() private _focusDate: string | undefined = undefined;
  @state() private _invalidRange: { start: string; end: string } | null = null;

  private _popup = new GUIPopupController(this, {
    getInteriorElements: () => [this._dateRef, this._calendarRef],
    focusRestoreSelector: 'gui-range-date input',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) =>
      target.closest('.gui-range-date-input__part') || target.closest('gui-range-calendar')
        ? 'open'
        : 'toggle',
    keyToggleMode: 'openClose',
    beforeOpen: (popup) => {
      const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
      if (dropdownWasOpen) popup.suppressNextFocusOut();
      this.closePillsDropdown();
    },
  });

  // Pills dropdown and the calendar are mutually exclusive, opening one closes the other
  onDropdownToggle = (event: Event) => {
    const detail = (event as CustomEvent<{ open: boolean }>).detail;
    if (detail?.open && this._popup.open) {
      this._popup.close();
    }
  };

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('dropdowntoggle', this.onDropdownToggle);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('dropdowntoggle', this.onDropdownToggle);
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._popup.open
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
          .disabledDateRangeMessage=${this.disabledDateRangeMessage}
          .numberOfMonths=${this.numberOfMonths}
          .localeId=${this.localeId}
          .hidePills=${true}
          .invalidRange=${this._invalidRange}
          @blur=${this.onCalendarBlur}
          @change=${this.onCalendarChange}
          @inputError=${this.onCalendarInputError}
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
        aria-expanded=${this._popup.open}
        @keyup=${this._popup.onAnchorKeyUp}
        @keydown=${this._popup.onAnchorKeyDown}
        @click=${this._popup.onAnchorClick}
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
          @focus=${this._popup.show}
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
    const value = event.detail.value as DateRange[] | undefined;
    for (const range of value ?? []) {
      const error = this.rangeError(range);
      if (error) {
        this.rejectTypedRange(range, error);
        return;
      }
    }
    this.commitValue(value);
  }

  /** The message for the first constraint a range violates, or null when valid. */
  private rangeError(range: DateRange): string | null {
    const start = range.start;
    const end = range.end ?? range.start;
    // A disabled day anywhere in the span — not just at the endpoints.
    if (rangeSpansDisabledDay(start, end, this.disabledRanges)) {
      return this.disabledDateRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE;
    }
    // Either endpoint outside the allowed [minDate, maxDate] window.
    const messages = {
      minDateMessage: this.minDateMessage,
      maxDateMessage: this.maxDateMessage,
    };
    for (const endpoint of [start, end]) {
      const error = dateBoundsError(endpoint, this.minDate, this.maxDate, undefined, messages);
      if (error) return error;
    }
    return null;
  }

  private rejectTypedRange(range: DateRange, message: string) {
    const start = range.start;
    const end = range.end ?? range.start;
    this._invalidRange = { start, end };
    const input = this._dateRef as GuiRangeDateInput | undefined;
    if (input) {
      input.value = this.value ?? [];
      input.showRange(start, end);
    }
    this.dispatchEvent(
      new CustomEvent('inputError', {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onDateBlur() {
    this.dispatchEvent(new CustomEvent('blur'));
  }

  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    (this._dateRef as GuiRangeDateInput | undefined)?.clearRangeInputs();
    this.commitValue(event.detail.value);
  }

  private onCalendarInputError(event: CustomEvent) {
    const range = event.detail?.range as { start: string; end: string } | undefined;
    if (!range) return;
    this._invalidRange = range;
    (this._dateRef as GuiRangeDateInput | undefined)?.showRange(range.start, range.end);
  }

  private commitValue(value: DateRange[] | null | undefined) {
    this.value = value ?? undefined;
    this._invalidRange = null;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value ?? null },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onCalendarBlur() {
    this._popup.close();
  }

  private onPillClick(event: CustomEvent) {
    this._focusDate = event.detail.range.start;
    this._popup.show();
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
