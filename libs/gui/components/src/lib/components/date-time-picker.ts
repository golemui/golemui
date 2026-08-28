import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange, DisabledTimeRange } from '@golemui/gui-shared/internals';
import './date-time-input';
import './date-time-calendar';
import type { GuiDateTime } from './date-time-input';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { dateBoundsError, toISODateString } from '../utils/date';
import {
  isTimeDisabled,
  parseISODateTimeString,
  resolveDisabledTimeRangesForDate,
  toISOTimeString,
  type HourFormat,
} from '../utils/time';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';
import { INVALID_DISABLED_TIME_RANGE_MESSAGE } from '../utils/messages';
import { CARET_DOWN_PATH } from '../utils/icons';

export class GuiDateTimePicker extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String }) icon: string | undefined = '';
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  @property({ type: String }) dayAriaLabel: string | undefined = undefined;
  @property({ type: String }) monthAriaLabel: string | undefined = undefined;
  @property({ type: String }) yearAriaLabel: string | undefined = undefined;
  @property({ type: String }) hourAriaLabel: string | undefined = undefined;
  @property({ type: String }) minuteAriaLabel: string | undefined = undefined;
  @property({ type: String }) dayPeriodAriaLabel: string | undefined = undefined;
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
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: DateRange[] | undefined =
    undefined;
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
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
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
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;

  /**
   * The uncommitted date/time halves of an in-progress selection. They live
   * on the picker — which stays mounted — so a partial selection survives the
   * popover unmount/remount cycle and reseeds the calendar on reopen.
   */
  @state() private _workingDate: string | undefined = undefined;
  @state() private _workingTime: string | undefined = undefined;

  private _internalValueChange = false;

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => this.onFocusLeave(),
  });

  private _popup = new GUIPopupController(this, {
    focusRestoreSelector: 'gui-date-time input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      if (target.closest('.gui-calendar__day-button')) return 'ignore';
      if (target.closest('.gui-time-list__option')) return 'ignore';
      return target.closest('.gui-date-time-input__part') || target.closest('.gui-picker__panel')
        ? 'open'
        : 'toggle';
    },
    keyToggleMode: 'toggle',
  });

  override createRenderRoot() {
    return this;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (!changedProperties.has('value')) return;
    if (this._internalValueChange) {
      this._internalValueChange = false;
      return;
    }

    const prev = changedProperties.get('value') as string | null | undefined;
    if (!prev && !this.value) return;

    // External value change (form write/reset): the form is authoritative,
    // any in-progress working selection is dropped.
    this._workingDate = undefined;
    this._workingTime = undefined;
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._popup.open
      ? addPickerPanel(
          this.uid ?? '',
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          html`<gui-date-time-calendar
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
            .workingDate=${this._workingDate}
            .workingTime=${this._workingTime}
            .deferFocusLeave=${true}
            .prevMonthIcon=${this.prevMonthIcon}
            .nextMonthIcon=${this.nextMonthIcon}
            .prevMonthAriaLabel=${this.prevMonthAriaLabel}
            .nextMonthAriaLabel=${this.nextMonthAriaLabel}
            .selectYearAriaLabel=${this.selectYearAriaLabel}
            .yearGridAriaLabel=${this.yearGridAriaLabel}
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
            @partsChange=${this.onCalendarPartsChange}
          ></gui-date-time-calendar>`,
        )
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
        @focusout=${this._focusLeave.onFocusOut}
      >
        <gui-date-time
          id="date-input"
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .deferFocusLeave=${true}
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
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .dayAriaLabel=${this.dayAriaLabel}
          .monthAriaLabel=${this.monthAriaLabel}
          .yearAriaLabel=${this.yearAriaLabel}
          .hourAriaLabel=${this.hourAriaLabel}
          .minuteAriaLabel=${this.minuteAriaLabel}
          .dayPeriodAriaLabel=${this.dayPeriodAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .incompleteMessage=${this.incompleteMessage}
          @blur=${this.onDateBlur}
          @focus=${this._popup.show}
          @change=${this.onDateChange}
          @partsChange=${this.onInputPartsChange}
        ></gui-date-time>
        <button
          type="button"
          class="gui-date-time-picker__arrow"
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
            <path d=${CARET_DOWN_PATH}></path>
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

  /**
   * The field's per-part blur stays inside the widget: moving from a segment
   * into the popover is not leaving the control, so it must not be reported
   * as a blur (which the form layer reads as "validate now"). The picker
   * reports blur from its own focus-leave check instead.
   */
  private onDateBlur(event: Event) {
    event.stopPropagation();
  }

  private onCalendarChange(event: CustomEvent) {
    if (!this._popup.open) {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();
    this.commitValue(event.detail.value);
    if (event.detail.value && event.detail.commit) {
      this._popup.close();
    }
  }

  /** The typed halves of the input feed the working state; the calendar follows via its props. */
  private onInputPartsChange(event: CustomEvent) {
    event.stopPropagation();
    this._workingDate = (event.detail.date as string | null) ?? undefined;
    this._workingTime = (event.detail.time as string | null) ?? undefined;
  }

  /** A calendar pick feeds the working state and paints the input's segments. */
  private onCalendarPartsChange(event: CustomEvent) {
    event.stopPropagation();
    const date = event.detail.date as string | null;
    const time = event.detail.time as string | null;
    this._workingDate = date ?? undefined;
    this._workingTime = time ?? undefined;

    // Paint only the halves the calendar actually holds: a null half must not
    // wipe partially typed segments the calendar never saw.
    const input = this.querySelector<GuiDateTime>('gui-date-time');
    if (date) input?.fillDate(date);
    if (time) input?.fillTime(time);
  }

  private commitValue(value: string | null | undefined) {
    const next = value ?? undefined;
    if (next !== this.value) this._internalValueChange = true;
    this.value = next;

    if (this.value) {
      this._workingDate = undefined;
      this._workingTime = undefined;
    }

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

  /**
   * The single point where the picker reports focus leaving the control: it
   * blurs (which the form layer reads as "validate now"), then hands the
   * embedded input its deferred settlement — a partial selection left behind
   * surfaces the incomplete message, an emptied one clears a message it
   * surfaced earlier. The input's resulting change bubbles back through the
   * picker, so its value follows. The working state survives, so reopening
   * the popover restores the partial.
   */
  private onFocusLeave(): void {
    this.dispatchEvent(new CustomEvent('blur'));
    this.querySelector<GuiDateTime>('gui-date-time')?.settleOnFocusLeave();
  }

  private validateBounds(value: string | undefined): string | null {
    if (!value) return null;
    const date = parseISODateTimeString(value);
    if (isNaN(date.getTime())) return null;

    const isoDate = toISODateString(date);
    const dateError = dateBoundsError(isoDate, this.minDate, this.maxDate, this.disabledRanges, {
      minDateMessage: this.minDateMessage,
      maxDateMessage: this.maxDateMessage,
      disabledDateRangeMessage: this.disabledDateRangeMessage,
    });
    if (dateError) return dateError;

    // Disabled time ranges are date-scoped, so resolve them for the value's day.
    const ranges = resolveDisabledTimeRangesForDate(this.disabledTimeRanges, isoDate);
    if (isTimeDisabled(toISOTimeString(date), ranges)) {
      return this.disabledTimeRangeMessage ?? INVALID_DISABLED_TIME_RANGE_MESSAGE;
    }
    return null;
  }

  /**
   * Focus leaving the calendar closes the popover, but it is not necessarily
   * leaving the picker (focus often returns to the field), so the calendar's
   * bubbling blur is stopped here and never reaches the form layer.
   */
  private onCalendarBlur(event: Event) {
    event.stopPropagation();
    this._popup.closeOnFocusLeave();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time-picker': GuiDateTimePicker;
  }
}

safeDefine('gui-date-time-picker', GuiDateTimePicker);
