import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import './range-date-input';
import type { GuiRangeDateInput } from './range-date-input';
import './range-calendar';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { fieldPanel, GUIPopupController } from '../controllers/popup.controller';
import { completeDateRange } from '../utils/date';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';
import type { CompleteDateRange, DateRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dateRangesValidity } from '../utils/range-validity';
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

/**
 * A date range field with a calendar popup: the start and the end are typed, or picked with two
 * clicks.
 *
 * ```html
 * <gui-range-date-picker label="Stay" locale-id="en-US"></gui-range-date-picker>
 * ```
 *
 * The popup closes when a range is complete. A range outside `minDate`/`maxDate` or over a disabled
 * day is shown with its error, and the value stays.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a range over a disabled day. `detail.message` is the error; show it through `errors`.
 * @cssprop --gui-calendar-width - Width of one month.
 * @cssprop --gui-calendar-day-button-size - Size of each day.
 * @cssprop --gui-calendar-change-month-button-width - Width of the previous- and next-month
 *   buttons.
 * @cssprop --gui-calendar-change-month-button-height - Height of the previous- and next-month
 *   buttons.
 * @cssprop --gui-calendar-year-button-width - Width of each year in the year grid.
 * @cssprop --gui-calendar-year-button-height - Height of each year in the year grid.
 * @cssprop --gui-calendar-year-grid-height - Height of the year grid.
 * @cssprop --gui-range-bg - Background of the days inside the selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 */
export class GuiRangeDatePicker extends GuiFormControl {
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
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ attribute: 'show-errors', converter: booleanAttribute }) showErrors:
    | boolean
    | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /** The date range, as `{ start, end }` ISO dates. Both ends are set, or the value is empty. */
  @property({ type: Object }) value: CompleteDateRange | undefined = undefined;
  /** Text shown between the start and end of the range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Accessible name of the start date field. An empty value removes it. */
  @property({ type: String, attribute: 'start-date-aria-label' }) startDateAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date field. An empty value removes it. */
  @property({ type: String, attribute: 'end-date-aria-label' }) endDateAriaLabel:
    | string
    | undefined = undefined;
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
  /** Error when focus leaves a partly filled value. */
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;

  @query('gui-range-date') private _dateRef?: GuiRangeDateInput;

  /**
   * The unfinished range, from either half of the widget: a day picked in the calendar or dates
   * typed into the field. It lives here, as the picker stays mounted, so a half-picked range
   * survives closing and reopening the popup.
   */
  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  /** Whether the unfinished range is a calendar pick, which leaving drops, rather than typed. */
  private _pickInCalendar = false;
  /** A range the picker rejected, painted red in the calendar. */
  @state() private _invalidRange: { start: string; end: string } | null = null;

  private _popup = new GUIPopupController(this, {
    floating: fieldPanel(this),
    focusRestoreSelector: 'gui-range-date input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      // A pick that completes the range closes the popup: its click must not open it again.
      if (target.closest('.gui-calendar__day-button')) return 'ignore';
      return target.closest('.gui-range-date-input__part') || target.closest('.gui-picker__panel')
        ? 'open'
        : 'toggle';
    },
    keyToggleMode: 'toggle',
  });

  /**
   * The single point where the picker reports focus leaving the control: the field settles what
   * is in its parts first (a half-typed range is cleared and reported, an unfinished calendar pick
   * dropped), then the picker blurs, which the form layer reads as "validate now".
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
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
  private get range(): CompleteDateRange | undefined {
    return completeDateRange(this.value);
  }

  /** The form submits and validates the range, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as CompleteDateRange | undefined;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  /** A range outside `minDate`/`maxDate` or over a disabled day, then bad input, then `required`. */
  protected override validate(): GuiValidity | null {
    const range = this.range;
    // A typed entry the inner field cannot turn into a value, or one the picker rejected.
    const badInput = this._dateRef?.partsBadInput() ?? null;
    return (
      dateRangesValidity(range ? [range] : [], this) ??
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
          html`<gui-range-calendar
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
            .holdPick=${true}
            .workingStart=${this._workingStart}
            .workingEnd=${this._workingEnd}
            .invalidRange=${this._invalidRange}
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
            .disabledDateRangeMessage=${this.disabledDateRangeMessage}
            .numberOfMonths=${this.numberOfMonths}
            .localeId=${this.localeId}
            @gui-blur=${this.onCalendarBlur}
            @gui-input=${stopPropagation}
            @gui-change=${this.onCalendarChange}
            @gui-parts-change=${this.onCalendarPartsChange}
            @gui-input-error=${this.onCalendarInputError}
          ></gui-range-calendar>`,
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
        <gui-range-date
          id=${`${this.domId}_date`}
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .idPrefix=${this.idPrefix}
          .hint=${this.hint}
          .showHint=${false}
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
          .separator=${this.separator}
          .startDateAriaLabel=${this.startDateAriaLabel}
          .endDateAriaLabel=${this.endDateAriaLabel}
          .dayAriaLabel=${this.dayAriaLabel}
          .monthAriaLabel=${this.monthAriaLabel}
          .yearAriaLabel=${this.yearAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          .incompleteMessage=${this.incompleteMessage}
          @gui-blur=${this.onDateBlur}
          @gui-focus=${stopPropagation}
          @gui-input=${this.onDateInput}
          @gui-change=${this.onDateChange}
          @gui-input-error=${this.onDateInputError}
          @gui-parts-change=${this.onInputPartsChange}
        ></gui-range-date>
        <button
          type="button"
          class="gui-range-date-picker__arrow"
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

  /** The message for the first constraint a range violates, or null when it is allowed. */
  private rangeError(range: CompleteDateRange): string | null {
    return dateRangesValidity([range], this)?.message ?? null;
  }

  /**
   * The field set a range, or cleared it. A range the picker does not allow stays in the field
   * with its error, and the value stays as it was.
   */
  private onDateInput(event: CustomEvent) {
    event.stopPropagation();
    const range = completeDateRange(event.detail.value);
    const error = range ? this.rangeError(range) : null;
    if (range && error) {
      this._invalidRange = range;
      this.setWorking(undefined, undefined);
      this._dateRef?.surfaceHostError(error);
      return;
    }
    this._invalidRange = null;
    this.value = range;
    dispatchValue(this, range ?? null, { commit: false });
  }

  /** The field committed what {@link onDateInput} accepted. */
  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    if (this._invalidRange) return;
    this.setWorking(undefined, undefined);
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

  /** The field's error is reported as the picker's own. */
  private onDateInputError(event: CustomEvent<GuiInputErrorEventDetail>) {
    stopPropagation(event);
    dispatchInputError(this, event.detail.message);
    // The inner field's bad input is part of this picker's validity.
    this.requestUpdate();
  }

  /** Typed dates feed the unfinished range; the calendar follows them. */
  private onInputPartsChange(event: CustomEvent<{ start: string | null; end: string | null }>) {
    event.stopPropagation();
    const start = event.detail.start ?? undefined;
    const end = event.detail.end ?? undefined;
    // The field re-reads its parts on blur too: only dates that differ from the pick are typing.
    if (start !== this._workingStart || end !== this._workingEnd) this._pickInCalendar = false;
    this.setWorking(start, end);
    // The inner field's bad input is part of this picker's validity.
    this.requestUpdate();
  }

  private setWorking(start: string | undefined, end: string | undefined): void {
    this._workingStart = start;
    this._workingEnd = end;
    if (!start && !end) this._pickInCalendar = false;
  }

  /** Drops the unfinished range and shows the value in the field again. */
  private showValue(): void {
    this.setWorking(undefined, undefined);
    this._dateRef?.fillGroup('start', this.range?.start ?? null);
    this._dateRef?.fillGroup('end', this.range?.end ?? null);
  }

  /**
   * The calendar's unfinished pick: its first day shows as the start in the field, with the end
   * empty. A dropped pick (Escape) puts the value back in the field.
   */
  private onCalendarPartsChange(
    event: CustomEvent<{ anchor: string | null; start: string | null; end: string | null }>,
  ) {
    event.stopPropagation();
    const { anchor } = event.detail;
    if (!anchor) {
      this.showValue();
      return;
    }
    // A new pick replaces a range rejected before it.
    this._invalidRange = null;
    this._dateRef?.clearHostError();
    this.setWorking(anchor, undefined);
    this._pickInCalendar = true;
    this._dateRef?.fillGroup('start', anchor);
    this._dateRef?.fillGroup('end', null);
  }

  /** A completed pick sets the value, closes the popup and, like Escape, returns focus to the field. */
  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    const range = completeDateRange(event.detail.value);
    this._invalidRange = null;
    this._dateRef?.clearHostError();
    this.setWorking(undefined, undefined);
    this.value = range;
    dispatchValue(this, range ?? null);
    this._popup.restoreFocusToInput();
    this._popup.close();
  }

  /** The calendar rejected a pick: the field shows it with the error, and the value stays. */
  private onCalendarInputError(event: CustomEvent) {
    stopPropagation(event);
    const range = completeDateRange(event.detail.range);
    if (!range) {
      dispatchInputError(this, event.detail.message);
      return;
    }
    this._invalidRange = range;
    this._dateRef?.showRejectedRange(range, event.detail.message);
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

/** The events `gui-range-date-picker` fires, with their types. */
export const GuiRangeDatePickerEvents = {
  ...valueEvents<GuiRangeDatePicker['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-picker': GuiRangeDatePicker;
  }
}

safeDefine('gui-range-date-picker', GuiRangeDatePicker);
