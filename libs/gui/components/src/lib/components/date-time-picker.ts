import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
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
import type { DateRange, DisabledTimeRange } from '../types';
import { boundsValidity, GuiFormControl, type GuiValidity } from '../gui-form-control';
import {
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  stopPropagation,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, requiredName } from '../utils/messages';

/**
 * A date and time field with a calendar and time popup.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 * @cssprop --gui-calendar-width - Width of one month.
 * @cssprop --gui-calendar-day-button-size - Size of each day.
 * @cssprop --gui-calendar-change-month-button-width - Width of the previous- and next-month
 *   buttons.
 * @cssprop --gui-calendar-change-month-button-height - Height of the previous- and next-month
 *   buttons.
 * @cssprop --gui-calendar-year-button-width - Width of each year in the year grid.
 * @cssprop --gui-calendar-year-button-height - Height of each year in the year grid.
 * @cssprop --gui-calendar-year-grid-height - Height of the year grid.
 * @cssprop --gui-calendar-time-grid-height - Height of the time grid.
 * @cssprop --gui-calendar-time-button-height - Height of each time in the grid.
 */
export class GuiDateTimePicker extends GuiFormControl {
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the button that opens the popup. An empty value keeps the default. */
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the day part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-aria-label' }) dayAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the month part. An empty value keeps the default. */
  @property({ type: String, attribute: 'month-aria-label' }) monthAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the year part. An empty value keeps the default. */
  @property({ type: String, attribute: 'year-aria-label' }) yearAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the hour part. An empty value keeps the default. */
  @property({ type: String, attribute: 'hour-aria-label' }) hourAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the minute part. An empty value keeps the default. */
  @property({ type: String, attribute: 'minute-aria-label' }) minuteAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the AM/PM part. An empty value keeps the default. */
  @property({ type: String, attribute: 'day-period-aria-label' }) dayPeriodAriaLabel:
    | string
    | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean, attribute: 'show-errors' }) showErrors: boolean | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /** The date and time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String }) value: string | undefined = undefined;
  /** Icon class name of the previous-month button. */
  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  /** Icon class name of the next-month button. */
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  /** Accessible name of the previous-month button. An empty value keeps the default. */
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the next-month button. An empty value keeps the default. */
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the button that opens the year grid. An empty value keeps the default. */
  @property({ type: String, attribute: 'select-year-aria-label' }) selectYearAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the year grid. An empty value keeps the default. */
  @property({ type: String, attribute: 'year-grid-aria-label' }) yearGridAriaLabel:
    | string
    | undefined = undefined;
  /** How day numbers are written. */
  @property({ type: String, attribute: 'day-format' }) dayFormat:
    | 'numeric'
    | '2-digit'
    | undefined = undefined;
  /** How weekday names are written in the header. */
  @property({ type: String, attribute: 'weekday-format' }) weekdayFormat:
    | 'short'
    | 'long'
    | 'narrow'
    | undefined = undefined;
  /** How the month is written in the header. */
  @property({ type: String, attribute: 'month-format' }) monthFormat:
    | 'numeric'
    | '2-digit'
    | 'long'
    | 'short'
    | 'narrow'
    | undefined = undefined;
  /** Earliest selectable date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  /** Latest selectable date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  /** Dates that cannot be picked, as `{ start, end }` ISO date ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: DateRange[] | undefined =
    undefined;
  /** Number of months shown side by side. */
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined =
    undefined;
  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  /** Earliest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  /** Latest selectable time, as an ISO time (`HH:mm:ss`). */
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  /** Times that cannot be picked, optionally only on a date or on some weekdays. */
  @property({ type: Array, attribute: 'disabled-time-ranges' }) disabledTimeRanges:
    | DisabledTimeRange[]
    | undefined = undefined;
  /** Allows typing any time, not only picking one from the list. */
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  /** Label of the time in the calendar. An empty value keeps the default. */
  @property({ type: String, attribute: 'time-label' }) timeLabel: string | undefined = undefined;
  /** Error for a complete but impossible date, such as February 31. */
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;
  /** Error for a date before `minDate`. */
  @property({ type: String, attribute: 'min-date-message' }) minDateMessage: string | undefined =
    undefined;
  /** Error for a date after `maxDate`. */
  @property({ type: String, attribute: 'max-date-message' }) maxDateMessage: string | undefined =
    undefined;
  /** Error for a date inside `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  /** Error for a time before `minTime`. */
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  /** Error for a time after `maxTime`. */
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  /** Error for a time inside `disabledTimeRanges`. */
  @property({ type: String, attribute: 'disabled-time-range-message' }) disabledTimeRangeMessage:
    | string
    | undefined = undefined;
  /** Text shown when no time can be picked. */
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;
  /** Error when focus leaves a partly filled value. */
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

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
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
          this.uid,
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          html`<gui-date-time-calendar
            id=${`${this.uid}_popup`}
            role="dialog"
            aria-labelledby=${this.label ? `${this.uid}_label` : nothing}
            aria-label=${this.label ? nothing : requiredName('calendar')}
            .uid=${this.uid}
            .hint=${this.hint}
            .touched=${this.touched}
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
            .timeLabel=${this.timeLabel}
            .minTimeMessage=${this.minTimeMessage}
            .maxTimeMessage=${this.maxTimeMessage}
            .disabledTimeRangeMessage=${this.disabledTimeRangeMessage}
            .noAvailableTimesMessage=${this.noAvailableTimesMessage}
            @gui-blur=${this.onCalendarBlur}
            @gui-input=${this.onCalendarInput}
            @gui-change=${this.onCalendarChange}
            @gui-parts-change=${this.onCalendarPartsChange}
            @gui-input-error=${this.onInnerInputError}
          ></gui-date-time-calendar>`,
        )
      : nothing;

    return html`
      ${addLabel(
        this.uid,
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
          id=${`${this.uid}_date`}
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .deferFocusLeave=${true}
          .errors=${this.errors}
          .touched=${this.touched}
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
          @gui-blur=${this.onDateBlur}
          @gui-focus=${this.onDateFocus}
          @gui-input=${this.onDateInput}
          @gui-change=${stopPropagation}
          @gui-parts-change=${this.onInputPartsChange}
          @gui-input-error=${this.onInnerInputError}
        ></gui-date-time>
        <button
          type="button"
          class="gui-date-time-picker__arrow"
          aria-label=${requiredName('showCalendar', this.toggleAriaLabel)}
          aria-haspopup="dialog"
          aria-expanded=${this._popup.open ? 'true' : 'false'}
          aria-controls=${`${this.uid}_popup`}
          ?disabled=${this.disabled}
          @click=${this.onToggleClick}
        >
          <span class="gui-caret" aria-hidden="true"></span>
        </button>

        ${calendar}
      </div>

      ${this.showErrors ? addErrors(this.uid, { errors: this.errors, touched: this.touched }) : ''}
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

  private onDateFocus(event: Event) {
    stopPropagation(event);
    this._popup.show();
  }

  /** The field's and the calendar's errors are reported as the picker's own. */
  private onInnerInputError(event: CustomEvent<GuiInputErrorEventDetail>) {
    stopPropagation(event);
    dispatchInputError(this, event.detail.message);
  }

  private onDateInput(event: CustomEvent) {
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

  private onCalendarInput(event: CustomEvent) {
    event.stopPropagation();
    if (!this._popup.open) return;
    this.commitValue(event.detail.value);
  }

  /**
   * A deliberate time pick in the calendar completes the selection and closes the popover,
   * returning focus to the field like Escape.
   */
  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    if (this._popup.open && event.detail.value) {
      this._popup.close();
      // Once the popover is gone: the calendar's time picker focuses its own field after the pick.
      this.updateComplete.then(() => this._popup.restoreFocusToInput());
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
    dispatchValue(this, value ?? null);
    if (error) dispatchInputError(this, error);
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
    dispatchBlur(this);
    this.querySelector<GuiDateTime>('gui-date-time')?.settleOnFocusLeave();
  }

  protected override validate(): GuiValidity | null {
    // The bounds are days: a time outside a day's allowed times reports as a custom error.
    const day = this.value?.slice(0, 10);
    return (
      boundsValidity(this.validateBounds(this.value), day, this.minDate, this.maxDate) ??
      super.validate()
    );
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
      return message('disabledTimeRange', this.disabledTimeRangeMessage);
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

/** The events `gui-date-time-picker` fires, with their types. */
export const GuiDateTimePickerEvents = {
  ...valueEvents<GuiDateTimePicker['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time-picker': GuiDateTimePicker;
  }
}

safeDefine('gui-date-time-picker', GuiDateTimePicker);
