import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange, DisabledTimeRange } from '@golemui/gui-shared/internals';
import './date-time-input';
import './date-time-calendar';
import type { HourFormat } from '../utils/time';
import { addErrors, addIcon, addLabel } from '../utils/templates';

@customElement('gui-date-time-picker')
export class GuiDateTimePicker extends LitElement {
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
  @property({ type: String }) value: string | undefined = undefined;
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
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateRange[]
    | undefined = undefined;
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined =
    undefined;
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-time-ranges' }) disabledTimeRanges:
    | DisabledTimeRange[]
    | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-time-range-message' }) disabledTimeRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;

  @query('#date-input') private _dateRef?: HTMLElement;
  @query('#calendar-input') private _calendarRef?: HTMLElement;

  @state() private _isCalendarOpen = false;

  private _focusOutRafId: number | undefined;

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
    if (!this._isCalendarOpen) return;

    const newFocusTarget = event.relatedTarget as Node;
    if (newFocusTarget && this.contains(newFocusTarget)) {
      return;
    }

    // Keyboard month navigation and the calendar's inner time picker both
    // move focus through transient null-relatedTarget focusouts. Defer the
    // close one frame and only close if focus has really left the picker.
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

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.onDocumentClick);
    this.addEventListener('focusout', this.onFocusOut);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.onDocumentClick);
    this.removeEventListener('focusout', this.onFocusOut);
    if (this._focusOutRafId !== undefined) {
      cancelAnimationFrame(this._focusOutRafId);
    }
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._isCalendarOpen
      ? html`<gui-date-time-calendar
          id="calendar-input"
          .uid=${this.uid}
          .hint=${this.hint}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .value=${this.value}
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
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledTimeRanges=${this.disabledTimeRanges}
          .allowCustomTime=${this.allowCustomTime}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .disabledTimeRangeMessage=${this.disabledTimeRangeMessage}
          .noAvailableTimesMessage=${this.noAvailableTimesMessage}
          @blur=${this.onCalendarBlur}
          @change=${this.onCalendarChange}
        ></gui-date-time-calendar>`
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
        @click=${this.toggleCalendar}
      >
        <gui-date-time
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
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .invalidDateMessage=${this.invalidDateMessage}
          @blur=${this.onDateBlur}
          @focus=${this.openCalendar}
          @change=${this.onDateChange}
        ></gui-date-time>
        <span class="gui-date-time-picker__arrow"
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
    this.value = event.detail.value ?? undefined;
  }

  private onDateBlur() {
    this.dispatchEvent(new CustomEvent('blur'));
  }

  // The calendar emits null when a day is picked while a value was set (time
  // cleared, awaiting a new time), so the popover only closes on a complete
  // day+time commit — closing on null would break the two-step flow.
  private onCalendarChange(event: CustomEvent) {
    // Unmounting the closed calendar blurs its not-yet-rendered inner time
    // input, which cascades into a spurious null change that would clobber
    // the value just committed — nothing from a closed calendar is real.
    if (!this._isCalendarOpen) {
      event.stopPropagation();
      return;
    }

    this.value = event.detail.value ?? undefined;
    if (event.detail.value) {
      this.closeCalendar();
    }
  }

  // The calendar's blur already bubbles up to the host, so only close here.
  private onCalendarBlur() {
    this.closeCalendar();
  }

  private onKeyUp = (event: KeyboardEvent) => {
    if (this.disabled) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      this._isCalendarOpen = !this._isCalendarOpen;
    }
  };

  private toggleCalendar = (event: Event) => {
    if (this.disabled) return;
    const target = event.target as HTMLElement;

    if (target.closest('.gui-calendar__day-button')) return;
    // A time option click commits the value and closes the popover; without
    // this guard the same click would bubble here and re-open it
    if (target.closest('.gui-time-list__option')) return;

    const isInputClick = target.closest('.gui-date-time-input__part');
    const isCalendarClick = target.closest('gui-date-time-calendar');
    if (isInputClick || isCalendarClick) {
      this.openCalendar();
    } else {
      this._isCalendarOpen = !this._isCalendarOpen;
    }
  };

  openCalendar = () => {
    if (this.disabled) return;
    if (!this._isCalendarOpen) {
      this._isCalendarOpen = true;
    }
  };

  closeCalendar() {
    this._isCalendarOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time-picker': GuiDateTimePicker;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-date-time-picker')) {
  customElements.define('gui-date-time-picker', GuiDateTimePicker);
}
