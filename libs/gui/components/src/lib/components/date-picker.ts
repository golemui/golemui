import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import './date-input';
import './calendar';
import type { GuiDate } from './date-input';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { dateBoundsError } from '../utils/date';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';
import { CARET_DOWN_PATH } from '../utils/icons';
import type { DateRange } from '../types';
import { boundsValidity, GuiFormControl, type GuiValidity } from '../gui-form-control';
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
import { message } from '../utils/messages';

/**
 * A date field with a calendar popup.
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
 */
export class GuiDatePicker extends GuiFormControl {
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the button that opens the popup. */
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the day part. */
  @property({ type: String, attribute: 'day-aria-label' }) dayAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the month part. */
  @property({ type: String, attribute: 'month-aria-label' }) monthAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the year part. */
  @property({ type: String, attribute: 'year-aria-label' }) yearAriaLabel: string | undefined =
    undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean, attribute: 'show-errors' }) showErrors: boolean | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /** The date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String }) value: string | undefined = undefined;
  /** Icon class name of the previous-month button. */
  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  /** Icon class name of the next-month button. */
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  /** Accessible name of the previous-month button. */
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the next-month button. */
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the button that opens the year grid. */
  @property({ type: String, attribute: 'select-year-aria-label' }) selectYearAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the year grid. */
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

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => this.onFocusLeave(),
  });

  private _popup = new GUIPopupController(this, {
    focusRestoreSelector: 'gui-date input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) => {
      if (target.closest('.gui-calendar__day-button')) return 'ignore';
      return target.closest('.gui-date-input__part') || target.closest('.gui-picker__panel')
        ? 'open'
        : 'toggle';
    },
    keyToggleMode: 'toggle',
  });

  override createRenderRoot() {
    return this;
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._popup.open
      ? addPickerPanel(
          this.uid,
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          html`<gui-calendar
            id=${`${this.uid}_popup`}
            role="dialog"
            aria-label=${message('calendar', this.label)}
            .uid=${this.uid}
            .hint=${this.hint}
            .touched=${this.touched}
            ?required=${this.required}
            ?disabled=${this.disabled}
            ?readonly=${this.readOnly}
            .value=${this.value}
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
            @gui-blur=${this.onCalendarBlur}
            @gui-input=${this.onCalendarInput}
            @gui-change=${this.onCalendarChange}
          ></gui-calendar>`,
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
        <gui-date
          id="date-input"
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
          .dayAriaLabel=${this.dayAriaLabel}
          .monthAriaLabel=${this.monthAriaLabel}
          .yearAriaLabel=${this.yearAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          .incompleteMessage=${this.incompleteMessage}
          @gui-blur=${this.onDateBlur}
          @gui-focus=${this.onDateFocus}
          @gui-input=${this.onDateInput}
          @gui-change=${this.onDateChange}
          @gui-input-error=${this.onDateInputError}
          @gui-parts-change=${stopPropagation}
        ></gui-date>
        <button
          type="button"
          class="gui-date-picker__arrow"
          aria-label=${message('showCalendar', this.toggleAriaLabel)}
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

      ${this.showErrors ? addErrors(this.uid, { errors: this.errors, touched: this.touched }) : ''}
    `;
  }

  private onToggleClick = (event: Event) => {
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

  /** The field's error is reported as the picker's own. */
  private onDateInputError(event: CustomEvent<GuiInputErrorEventDetail>) {
    stopPropagation(event);
    dispatchInputError(this, event.detail.message);
  }

  private onDateInput(event: CustomEvent) {
    event.stopPropagation();
    this.updateValue(event.detail.value);
  }

  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    dispatchChange(this, this.value ?? null);
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
    this.updateValue(event.detail.value);
  }

  /** A pick closes the calendar and, like Escape, returns focus to the field. */
  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    dispatchChange(this, this.value ?? null);
    this._popup.restoreFocusToInput();
    this._popup.close();
  }

  private updateValue(value: string | null | undefined) {
    this.value = value ?? undefined;
    const error = this.validateBounds(this.value);
    dispatchValue(this, value ?? null, { commit: false });
    if (error) dispatchInputError(this, error);
  }

  protected override validate(): GuiValidity | null {
    return (
      boundsValidity(this.validateBounds(this.value), this.value, this.minDate, this.maxDate) ??
      super.validate()
    );
  }

  private validateBounds(value: string | undefined): string | null {
    if (!value) return null;
    return dateBoundsError(value, this.minDate, this.maxDate, this.disabledRanges, {
      minDateMessage: this.minDateMessage,
      maxDateMessage: this.maxDateMessage,
      disabledDateRangeMessage: this.disabledDateRangeMessage,
    });
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

  /**
   * The single point where the picker reports focus leaving the control: it
   * blurs (which the form layer reads as "validate now"), then hands the
   * embedded input its deferred settlement — a partial date left behind
   * surfaces the incomplete message, an emptied one clears a message it
   * surfaced earlier. The input's resulting change bubbles back through
   * {@link onDateInput}, so the picker's value follows.
   */
  private onFocusLeave(): void {
    dispatchBlur(this);
    this.querySelector<GuiDate>('gui-date')?.settleOnFocusLeave();
  }
}

/** The events `gui-date-picker` fires, with their types. */
export const GuiDatePickerEvents = {
  ...valueEvents<GuiDatePicker['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-picker': GuiDatePicker;
  }
}

safeDefine('gui-date-picker', GuiDatePicker);
