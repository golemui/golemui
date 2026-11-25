import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import './range-date-time-input';
import './range-date-time-calendar';
import type { GuiRangeDateTimeInput } from './range-date-time-input';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { fieldPanel, GUIPopupController } from '../controllers/popup.controller';
import { completeRange } from '../utils/range-commit';
import { type HourFormat } from '../utils/time';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';
import type { DateTimeRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dateTimeRangesValidity } from '../utils/range-validity';
import {
  dispatchBlur,
  dispatchChange,
  dispatchInputError,
  dispatchValue,
  fires,
  stopPropagation,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { requiredName } from '../utils/messages';

interface WorkingRange {
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
}

const dayOf = (iso: string | undefined) => iso?.split('T')[0];
const timeOf = (iso: string | undefined) => iso?.split('T')[1];

/**
 * A date-time range field with a calendar and time popup: the start and the end are typed, or
 * picked as two days and two times.
 *
 * ```html
 * <gui-range-date-time-picker label="Rental" locale-id="en-US" minute-step="30">
 * </gui-range-date-time-picker>
 * ```
 *
 * The popup closes when a range is complete. A range outside `minDateTime`/`maxDateTime` or over a
 * disabled span is shown with its error, and the value stays.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a range over a disabled span. `detail.message` is the error; show it through `errors`.
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
 * @cssprop --gui-range-bg - Background of the days inside the selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 */
export class GuiRangeDateTimePicker extends GuiFormControl {
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ attribute: 'show-errors', converter: booleanAttribute }) showErrors:
    | boolean
    | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /**
   * The date-time range, as `{ start, end }` local ISO date-times. Both ends are set, or the value
   * is empty.
   */
  @property({ type: Object }) value: DateTimeRange | undefined = undefined;
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
  /** Text shown between the start and end of a range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Accessible name of the start date-time field. An empty value removes it. */
  @property({ type: String, attribute: 'start-date-time-aria-label' }) startDateTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date-time field. An empty value removes it. */
  @property({ type: String, attribute: 'end-date-time-aria-label' }) endDateTimeAriaLabel:
    | string
    | undefined = undefined;
  /** Error for a complete but impossible date, such as February 31. */
  @property({ type: String, attribute: 'invalid-date-message' }) invalidDateMessage:
    | string
    | undefined = undefined;

  // Calendar chrome
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
  /** Number of months shown side by side. */
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined =
    undefined;

  // Time
  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  /** Allows typing any time, not only picking one from the list. */
  @property({ attribute: 'allow-custom-time', converter: booleanAttribute }) allowCustomTime:
    | boolean
    | undefined = false;
  /** Label of the start time. An empty value keeps the default. */
  @property({ type: String, attribute: 'start-time-label' }) startTimeLabel: string | undefined =
    undefined;
  /** Label of the end time. An empty value keeps the default. */
  @property({ type: String, attribute: 'end-time-label' }) endTimeLabel: string | undefined =
    undefined;

  // Instant-space bounds and holes
  /** Earliest allowed date-time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String, attribute: 'min-date-time' }) minDateTime: string | undefined =
    undefined;
  /** Latest allowed date-time, as an ISO date-time (`YYYY-MM-DDTHH:mm:ss`). */
  @property({ type: String, attribute: 'max-date-time' }) maxDateTime: string | undefined =
    undefined;
  /** Error for a date-time before `minDateTime`. */
  @property({ type: String, attribute: 'min-date-time-message' }) minDateTimeMessage:
    | string
    | undefined = undefined;
  /** Error for a date-time after `maxDateTime`. */
  @property({ type: String, attribute: 'max-date-time-message' }) maxDateTimeMessage:
    | string
    | undefined = undefined;
  /** Date-times that cannot be picked, as `{ start, end }` ISO date-time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  /** Error for a time inside `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-range-message' }) disabledRangeMessage:
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
   * Read with a day that has disabled times, before the times themselves. `{count}` is the number
   * of disabled ranges.
   */
  @property({ type: String, attribute: 'disabled-day-count-aria-label' })
  disabledDayCountAriaLabel: string | undefined = undefined;

  @query('gui-range-date-time') private _dateRef?: GuiRangeDateTimeInput;

  /**
   * The unfinished range, from either half of the widget: days and times picked in the calendar,
   * or ends typed into the field. It lives here, as the picker stays mounted, so a half-finished
   * range survives closing and reopening the popup.
   */
  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  @state() private _workingStartTime: string | undefined = undefined;
  @state() private _workingEndTime: string | undefined = undefined;
  /** Whether the unfinished range is a calendar pick, which leaving drops, rather than typed. */
  private _pickInCalendar = false;

  private _popup = new GUIPopupController(this, {
    floating: fieldPanel(this),
    focusRestoreSelector: 'gui-range-date-time input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      if (target.closest('.gui-calendar__day-button')) return 'ignore';
      if (target.closest('.gui-time-list__option')) return 'ignore';
      if (target.closest('gui-time-picker')) return 'ignore';
      return target.closest('.gui-range-date-time-input__field') ||
        target.closest('.gui-picker__panel')
        ? 'open'
        : 'toggle';
    },
    keyToggleMode: 'openClose',
  });

  /**
   * The single point where the picker reports focus leaving the control: an unfinished calendar
   * pick is dropped and the value shown again, a half-typed range is cleared and reported, and only
   * then does the picker blur, which the form layer reads as "validate now".
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    resolveSyncOnRelatedTarget: true,
    onLeave: () => {
      if (this._pickInCalendar) {
        this.showValue();
      } else {
        this._dateRef?.settleOnFocusLeave();
      }
      dispatchBlur(this);
    },
  });

  /** The value, when both ends are set. */
  private get range(): DateTimeRange | undefined {
    return completeRange(this.value);
  }

  /** The form submits and validates the range, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as DateTimeRange | undefined;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  /**
   * A range outside `minDateTime`/`maxDateTime` or over a disabled span, then bad input, then
   * `required`.
   */
  protected override validate(): GuiValidity | null {
    const range = this.range;
    // A typed entry the inner field cannot turn into a value, or one it rejected.
    const badInput = this._dateRef?.partsBadInput() ?? null;
    return (
      dateTimeRangesValidity(range ? [range] : [], this) ??
      (badInput ? { flags: { badInput: true }, message: badInput } : null) ??
      super.validate()
    );
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._popup.open
      ? addPickerPanel(
          this,
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          html`<gui-range-date-time-calendar
            id=${`${this.domId}_popup`}
            role="dialog"
            aria-labelledby=${this.label ? `${this.domId}_label` : nothing}
            aria-label=${this.label ? nothing : requiredName('calendar')}
            .uid=${this.uid}
            .idPrefix=${this.idPrefix}
            .hint=${this.hint}
            .showHint=${false}
            .touched=${this.touched}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .value=${this.value}
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
            .disabledDayCountAriaLabel=${this.disabledDayCountAriaLabel}
            .workingStart=${this._workingStart}
            .workingEnd=${this._workingEnd}
            .workingStartTime=${this._workingStartTime}
            .workingEndTime=${this._workingEndTime}
            .deferFocusLeave=${true}
            @gui-blur=${this.onCalendarBlur}
            @gui-input=${stopPropagation}
            @gui-change=${this.onCalendarChange}
            @gui-parts-change=${this.onCalendarPartsChange}
            @gui-input-error=${this.onInputError}
          ></gui-range-date-time-calendar>`,
        )
      : nothing;

    return html`
      ${addLabel(
        this,
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
        <gui-range-date-time
          .deferFocusLeave=${true}
          id=${`${this.domId}_date`}
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .idPrefix=${this.idPrefix}
          .hint=${this.hint}
          .showHint=${false}
          .showErrors=${false}
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
          .separator=${this.separator}
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
          .incompleteMessage=${this.incompleteMessage}
          @gui-blur=${this.onDateBlur}
          @gui-focus=${stopPropagation}
          @gui-input=${this.onDateInput}
          @gui-change=${this.onDateChange}
          @gui-input-error=${this.onInputError}
          @gui-parts-change=${this.onInputPartsChange}
        ></gui-range-date-time>
        <button
          type="button"
          class="gui-range-date-time-picker__arrow"
          aria-label=${requiredName('showCalendar', this.toggleAriaLabel)}
          aria-haspopup="dialog"
          aria-expanded=${this._popup.open ? 'true' : 'false'}
          aria-controls=${`${this.domId}_popup`}
          ?disabled=${this.disabled}
          @click=${this.onToggleClick}
        >
          <span class="gui-caret" aria-hidden="true"></span>
        </button>

        ${calendar}
      </div>

      ${this.showErrors !== false
        ? addErrors(this, { errors: this.errors, touched: this.touched })
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

  /** The field set a range, or cleared it. */
  private onDateInput(event: CustomEvent) {
    event.stopPropagation();
    const range = completeRange(event.detail.value);
    this.value = range;
    dispatchValue(this, range ?? null, { commit: false });
  }

  /** The field committed a range: the unfinished one is done. */
  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    this.setWorking({});
    dispatchChange(this, this.range ?? null);
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

  /**
   * Applies a new working range, repainting only the pieces that actually
   * changed. Repainting every reported piece would wipe half-typed segments
   * the other half of the widget never saw.
   */
  private setWorking(next: WorkingRange, paint = false): void {
    const changed = {
      start: next.start !== this._workingStart,
      end: next.end !== this._workingEnd,
      startTime: next.startTime !== this._workingStartTime,
      endTime: next.endTime !== this._workingEndTime,
    };
    this._workingStart = next.start;
    this._workingEnd = next.end;
    this._workingStartTime = next.startTime;
    this._workingEndTime = next.endTime;
    if (!next.start && !next.end) this._pickInCalendar = false;

    const input = this._dateRef;
    if (!paint || !input) return;
    if (changed.start) input.fillDate('start', next.start ?? null);
    if (changed.end) input.fillDate('end', next.end ?? null);
    if (changed.startTime) input.fillTime('start', next.startTime ?? null);
    if (changed.endTime) input.fillTime('end', next.endTime ?? null);
  }

  /** Drops the unfinished range and shows the value in the field again. */
  private showValue(): void {
    const range = this.range;
    this.setWorking({});
    const input = this._dateRef;
    if (!input) return;
    input.fillDate('start', dayOf(range?.start) ?? null);
    input.fillDate('end', dayOf(range?.end) ?? null);
    input.fillTime('start', timeOf(range?.start) ?? null);
    input.fillTime('end', timeOf(range?.end) ?? null);
  }

  /**
   * Typed ends feed the working range, so the calendar follows them. The field re-reads its parts
   * on blur too: only pieces that differ from a calendar pick are typing.
   */
  private onInputPartsChange(
    event: CustomEvent<{
      start: { date: string | null; time: string | null };
      end: { date: string | null; time: string | null };
    }>,
  ) {
    event.stopPropagation();
    const { start, end } = event.detail;
    const next = {
      start: start.date ?? undefined,
      end: end.date ?? undefined,
      startTime: start.time ?? undefined,
      endTime: end.time ?? undefined,
    };
    if (
      next.start !== this._workingStart ||
      next.end !== this._workingEnd ||
      next.startTime !== this._workingStartTime ||
      next.endTime !== this._workingEndTime
    ) {
      this._pickInCalendar = false;
    }
    this.setWorking(next);
    // The inner field's bad input is part of this picker's validity.
    this.requestUpdate();
  }

  /**
   * The calendar's unfinished pick, held here so it survives the popup, and painted into the field
   * so every piece picked reads back as a date-time. Until the days complete, the first day stands
   * in for the start; a pick that ends (committed or dropped) arrives without days.
   */
  private onCalendarPartsChange(event: CustomEvent) {
    event.stopPropagation();
    const anchor = (event.detail.anchor as string | null) ?? undefined;
    const start = (event.detail.start as string | null) ?? undefined;
    const end = (event.detail.end as string | null) ?? undefined;
    const times = {
      startTime: (event.detail.startTime as string | null) ?? undefined,
      endTime: (event.detail.endTime as string | null) ?? undefined,
    };

    if (!anchor && !start && !end) {
      this.showValue();
      return;
    }
    this.setWorking(start || end ? { start, end, ...times } : { start: anchor, ...times }, true);
    // A new pick begins: the end date the field showed was the value's, not a working one.
    if (!start && !end) this._dateRef?.fillDate('end', null);
    this._pickInCalendar = true;
  }

  /** A completed pick sets the value, closes the popup and returns focus to the field. */
  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    const range = completeRange(event.detail.value);
    this.value = range;
    this.setWorking({});
    dispatchValue(this, range ?? null);
    this._popup.restoreFocusToInput();
    this._popup.close();
  }

  /** The field's and the calendar's errors are reported as the picker's own. */
  private onInputError(event: CustomEvent<GuiInputErrorEventDetail>) {
    stopPropagation(event);
    dispatchInputError(this, event.detail.message);
    // The inner field's bad input is part of this picker's validity.
    this.requestUpdate();
  }

  /**
   * Focus leaving the calendar closes the popover, but it is not necessarily
   * leaving the picker (focus often returns to the fields), so the calendar's
   * bubbling blur is stopped here and never reaches the form layer.
   */
  private onCalendarBlur(event: Event) {
    event.stopPropagation();
    this._popup.closeOnFocusLeave();
  }
}

/** The events `gui-range-date-time-picker` fires, with their types. */
export const GuiRangeDateTimePickerEvents = {
  ...valueEvents<GuiRangeDateTimePicker['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time-picker': GuiRangeDateTimePicker;
  }
}

safeDefine('gui-range-date-time-picker', GuiRangeDateTimePicker);
