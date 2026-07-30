import { html, LitElement, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateTimeRange } from '@golemui/gui-shared/internals';
import './range-date-time-input';
import './range-date-time-calendar';
import { GUIPopupController } from '../controllers/popup.controller';
import { type HourFormat } from '../utils/time';
import { addErrors, addIcon, addLabel } from '../utils/templates';

@customElement('gui-range-date-time-picker')
export class GuiRangeDateTimePicker extends LitElement {
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
  @property({ type: Array }) value: DateTimeRange[] | undefined = [];

  // Trigger (input) chrome
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  @property({ type: String }) dayAriaLabel: string | undefined = undefined;
  @property({ type: String }) monthAriaLabel: string | undefined = undefined;
  @property({ type: String }) yearAriaLabel: string | undefined = undefined;
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;
  @property({ type: String }) separator: string | undefined = undefined;
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'start-date-time-aria-label' }) startDateTimeAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'end-date-time-aria-label' }) endDateTimeAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  // Calendar chrome
  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'select-year-aria-label' }) selectYearAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'year-grid-aria-label' }) yearGridAriaLabel:
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
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined =
    undefined;

  // Time
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  @property({ type: String, attribute: 'start-time-label' }) startTimeLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'end-time-label' }) endTimeLabel: string | undefined =
    undefined;

  // Instant-space bounds and holes
  @property({ type: String, attribute: 'min-date-time' }) minDateTime: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-time' }) maxDateTime: string | undefined =
    undefined;
  @property({ type: String, attribute: 'min-date-time-message' }) minDateTimeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'max-date-time-message' }) maxDateTimeMessage:
    | string
    | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'day-count-aria-label' }) dayCountAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'disabled-day-count-aria-label' })
  disabledDayCountAriaLabel: string | undefined = undefined;

  @query('#date-input') private _dateRef?: HTMLElement;
  @query('gui-range-date-time-calendar') private _calendarRef?: HTMLElement;
  @query('.gui-range-date-time-picker__arrow') private _toggleRef?: HTMLElement;

  @state() private _focusDate: string | undefined = undefined;

  private _popup = new GUIPopupController(this, {
    getInteriorElements: () => [this._dateRef, this._calendarRef, this._toggleRef],
    focusRestoreSelector: 'gui-range-date-time input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      if (target.closest('.gui-calendar__day-button')) return 'ignore';
      if (target.closest('.gui-time-list__option')) return 'ignore';
      if (target.closest('gui-time-picker')) return 'ignore';
      return target.closest('.gui-range-date-time-input__field') ||
        target.closest('gui-range-date-time-calendar')
        ? 'open'
        : 'toggle';
    },
    keyToggleMode: 'openClose',
    beforeOpen: (popup) => {
      const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
      if (dropdownWasOpen) popup.suppressNextFocusOut();
      this.closePillsDropdown();
    },
    onOpenChanged: (open) => {
      if (!open) this._focusDate = undefined;
    },
  });

  // Pills dropdown and the calendar are mutually exclusive; opening one closes the other.
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
      ? html`<gui-range-date-time-calendar
          id=${`${this.uid}_popup`}
          role="dialog"
          aria-label=${this.label ?? 'Calendar'}
          .uid=${this.uid}
          .hint=${this.hint}
          ?touched=${this.touched}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .value=${this.value}
          .focusDate=${this._focusDate}
          .hidePills=${true}
          .localeId=${this.localeId}
          .prevMonthIcon=${this.prevMonthIcon}
          .nextMonthIcon=${this.nextMonthIcon}
          .prevMonthAriaLabel=${this.prevMonthAriaLabel}
          .nextMonthAriaLabel=${this.nextMonthAriaLabel}
          .selectYearAriaLabel=${this.selectYearAriaLabel}
          .yearGridAriaLabel=${this.yearGridAriaLabel}
          .dayFormat=${this.dayFormat}
          .weekdayFormat=${this.weekdayFormat}
          .monthFormat=${this.monthFormat}
          .numberOfMonths=${this.numberOfMonths}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .allowCustomTime=${this.allowCustomTime}
          .startTimeLabel=${this.startTimeLabel}
          .endTimeLabel=${this.endTimeLabel}
          .minDateTime=${this.minDateTime}
          .maxDateTime=${this.maxDateTime}
          .minDateTimeMessage=${this.minDateTimeMessage}
          .maxDateTimeMessage=${this.maxDateTimeMessage}
          .disabledRanges=${this.disabledRanges}
          .disabledRangeMessage=${this.disabledRangeMessage}
          .noAvailableTimesMessage=${this.noAvailableTimesMessage}
          .dayCountAriaLabel=${this.dayCountAriaLabel}
          .disabledDayCountAriaLabel=${this.disabledDayCountAriaLabel}
          @blur=${this.onCalendarBlur}
          @change=${this.onCalendarChange}
          @inputError=${this.onCalendarInputError}
        ></gui-range-date-time-calendar>`
      : nothing;

    return html`
      ${addLabel(
        this.uid ?? '',
        {
          label: this.label,
          hint: this.hint,
          required: this.required,
        },
        false,
        undefined,
        false,
      )}

      <div
        class="gui-widget"
        @keydown=${this._popup.onAnchorKeyDown}
        @click=${this._popup.onAnchorClick}
      >
        <gui-range-date-time
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
          .separator=${this.separator}
          .removePillAriaLabel=${this.removePillAriaLabel}
          .startDateTimeAriaLabel=${this.startDateTimeAriaLabel}
          .endDateTimeAriaLabel=${this.endDateTimeAriaLabel}
          .dayAriaLabel=${this.dayAriaLabel}
          .monthAriaLabel=${this.monthAriaLabel}
          .yearAriaLabel=${this.yearAriaLabel}
          .hourAriaLabel=${this.hourAriaLabel}
          .minuteAriaLabel=${this.minuteAriaLabel}
          .dayPeriodAriaLabel=${this.dayPeriodAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          .minDateTime=${this.minDateTime}
          .maxDateTime=${this.maxDateTime}
          .minDateTimeMessage=${this.minDateTimeMessage}
          .maxDateTimeMessage=${this.maxDateTimeMessage}
          .disabledRanges=${this.disabledRanges}
          .disabledRangeMessage=${this.disabledRangeMessage}
          @blur=${this.onDateBlur}
          @focus=${this._popup.show}
          @change=${this.onDateChange}
          @pillClick=${this.onPillClick}
        ></gui-range-date-time>
        <button
          type="button"
          class="gui-range-date-time-picker__arrow"
          aria-label=${this.toggleAriaLabel ?? 'Show calendar'}
          aria-haspopup="dialog"
          aria-expanded=${this._popup.open ? 'true' : 'false'}
          aria-controls=${`${this.uid}_popup`}
          ?disabled=${this.disabled}
          @click=${this.onToggleClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            aria-hidden="true"
          >
            <path
              d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"
            ></path>
          </svg>
        </button>

        ${calendar}
      </div>

      ${this.showErrors
        ? addErrors(this.uid ?? '', { errors: this.errors, touched: this.touched })
        : ''}
    `;
  }

  private onToggleClick = (event: Event) => {
    // The wrapper's clickIntent handler must not double-handle the toggle.
    event.stopPropagation();
    if (this._popup.open) {
      this._popup.close();
    } else {
      this._popup.openAndFocus();
    }
  };

  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    this.commitValue(event.detail.value);
  }

  private onDateBlur() {
    this.dispatchEvent(new CustomEvent('blur'));
  }

  private onCalendarChange(event: CustomEvent) {
    if (!this._popup.open) {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    this.commitValue(event.detail.value);
    this._popup.suppressNextFocusOut();
    requestAnimationFrame(() => {
      if (!this._popup.open) return;
      const day = this.querySelector<HTMLElement>(
        'gui-range-date-time-calendar .gui-calendar__day-button[tabindex="0"]',
      );
      day?.focus();
    });
  }

  private onCalendarInputError(event: CustomEvent) {
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('inputError', {
        detail: event.detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private commitValue(value: DateTimeRange[] | null | undefined) {
    this.value = value ?? undefined;
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
    'gui-range-date-time-picker': GuiRangeDateTimePicker;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date-time-picker')) {
  customElements.define('gui-range-date-time-picker', GuiRangeDateTimePicker);
}
