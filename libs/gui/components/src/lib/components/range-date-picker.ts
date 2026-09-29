import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import './range-date-input';
import type { GuiRangeDateInput } from './range-date-input';
import './range-calendar';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { dateBoundsError, rangeSpansDisabledDay } from '../utils/date';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';
import { CARET_DOWN_PATH } from '../utils/icons';
import type { DateRange } from '../types';
import { GuiFormControl } from '../gui-form-control';
import { dispatchChange, dispatchValue, stopPropagation } from '../utils/events';
import { message } from '../utils/messages';

/**
 * A date range field with a calendar popup.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user added, removed or finished editing a range. `detail.value` is the
 *   list of ranges.
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
 * @cssprop --gui-range-bg - Background of the days inside a selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiRangeDatePicker extends GuiFormControl {
  /** Icon class name shown inside the control, for example from an icon font. */
  @property({ type: String }) icon: string | undefined = '';
  /** Accessible name of the button that opens the popup. */
  @property({ type: String, attribute: 'toggle-aria-label' }) toggleAriaLabel: string | undefined =
    undefined;
  /** Accessible name of the day part. */
  @property({ type: String }) dayAriaLabel: string | undefined = undefined;
  /** Accessible name of the month part. */
  @property({ type: String }) monthAriaLabel: string | undefined = undefined;
  /** Accessible name of the year part. */
  @property({ type: String }) yearAriaLabel: string | undefined = undefined;
  /**
   * Whether the element renders its own error list. Elements that embed it turn it off and show the
   * errors themselves.
   */
  @property({ type: Boolean }) showErrors: boolean | undefined = true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  /** The date ranges, as `{ start, end }` ISO dates. */
  @property({ type: Array }) value: DateRange[] | undefined = [];
  /** Text shown between the start and end of a range. */
  @property({ type: String }) separator: string | undefined = undefined;
  /** Accessible name of the remove button of each range pill. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the start date field. */
  @property({ type: String, attribute: 'start-date-aria-label' }) startDateAriaLabel:
    | string
    | undefined = undefined;
  /** Accessible name of the end date field. */
  @property({ type: String, attribute: 'end-date-aria-label' }) endDateAriaLabel:
    | string
    | undefined = undefined;
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
  /** Lets the user edit a range in place from its pill. */
  @property({ type: Boolean, attribute: 'allow-edit' }) allowEdit: boolean | undefined = false;
  /** Tooltip of the edit button of a range pill. */
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  /** Hint that a range pill can be edited. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  /** Tooltip of the confirm button of a range being edited. */
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  /** Tooltip of the cancel button of a range being edited. */
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  /** Announcement when editing a range starts. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  /** Announcement when an edited range is saved. `{label}` is the new range. */
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
  /** Announcement when editing a range is cancelled. */
  @property({ type: String, attribute: 'edit-cancelled-message' }) editCancelledMessage:
    | string
    | undefined = undefined;

  @query('#date-input') private _dateRef?: GuiRangeDateInput;

  /**
   * Mirror of the embedded input's edit session, fed by its non-bubbling
   * `gui-edit-state-change`: while a session is open the calendar defers commits to
   * the session's Confirm, and the selected range's days are marked.
   */
  @state() private _editing = false;
  @state() private _selectedEditRange: DateRange | null = null;

  @state() private _focusDate: string | undefined = undefined;
  /**
   * The in-progress range, from either half of the widget: days picked in the
   * calendar or endpoints typed into the input. It lives here — the picker
   * stays mounted — so a half-picked span survives closing and reopening the
   * popover, and it is what the calendar and the input each render.
   */
  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  @state() private _invalidRange: { start: string; end: string } | null = null;

  private _popup = new GUIPopupController(this, {
    focusRestoreSelector: 'gui-range-date input',
    focusPopupSelector: '.gui-calendar__day-button[tabindex="0"]',
    isDisabled: () => !!this.disabled,
    clickIntent: (target) =>
      target.closest('.gui-range-date-input__part') || target.closest('.gui-picker__panel')
        ? 'open'
        : 'toggle',
    keyToggleMode: 'openClose',
    beforeOpen: (popup) => {
      const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
      if (dropdownWasOpen) popup.suppressNextFocusOut();
      this.closePillsDropdown();
    },
  });

  /**
   * The single point where the picker reports focus leaving the control: the
   * input settles what is in its fields — committing a complete range,
   * surfacing a half-typed one — and only then does the picker blur, which the
   * form layer reads as "validate now". Blurring first would validate the
   * value the commit is about to replace.
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    resolveSyncOnRelatedTarget: true,
    onLeave: () => {
      this._dateRef?.finalizeOnLeave();
      this.dispatchEvent(new CustomEvent('gui-blur'));
    },
  });

  // Pills dropdown and the calendar are mutually exclusive, opening one closes the other
  /** @internal */
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
    this.addEventListener('gui-dropdown-toggle', this.onDropdownToggle);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('gui-dropdown-toggle', this.onDropdownToggle);
  }

  override render() {
    const datePickerIcon = addIcon('datePicker', { icon: this.icon });

    const calendar = this._popup.open
      ? addPickerPanel(
          this.uid,
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          html`<gui-range-calendar
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
            .focusDate=${this._focusDate}
            .workingStart=${this._workingStart}
            .workingEnd=${this._workingEnd}
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
            .hidePills=${true}
            .invalidRange=${this._invalidRange}
            .selectedRange=${this._selectedEditRange}
            .deferCommit=${this._editing}
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
        @keydown=${this.onWidgetKeyDown}
        @click=${this._popup.onAnchorClick}
        @focusout=${this._focusLeave.onFocusOut}
      >
        <gui-range-date
          id="date-input"
          .deferFocusLeave=${true}
          class=${classMap(datePickerIcon.widgetClasses)}
          .uid=${this.uid}
          .hint=${this.hint}
          .showErrors=${false}
          .errors=${this.errors}
          .touched=${this.touched}
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
          .dayAriaLabel=${this.dayAriaLabel}
          .monthAriaLabel=${this.monthAriaLabel}
          .yearAriaLabel=${this.yearAriaLabel}
          .invalidDateMessage=${this.invalidDateMessage}
          .incompleteMessage=${this.incompleteMessage}
          .allowEdit=${this.allowEdit ?? false}
          .editLabel=${this.editLabel}
          .editAriaLabel=${this.editAriaLabel}
          .confirmEditLabel=${this.confirmEditLabel}
          .cancelEditLabel=${this.cancelEditLabel}
          .editStartedMessage=${this.editStartedMessage}
          .editCommittedMessage=${this.editCommittedMessage}
          .editCancelledMessage=${this.editCancelledMessage}
          @gui-blur=${this.onDateBlur}
          @gui-focus=${this._popup.show}
          @gui-input=${this.onDateInput}
          @gui-change=${this.onDateChange}
          @gui-parts-change=${this.onInputPartsChange}
          @gui-range-click=${this.onPillClick}
          @gui-edit-state-change=${this.onEditStateChange}
        ></gui-range-date>
        <button
          type="button"
          class="gui-range-date-picker__arrow"
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
    // The wrapper's clickIntent handler must not double-handle the toggle.
    event.stopPropagation();
    if (this._popup.open) {
      this._popup.close();
    } else {
      this._popup.openAndFocus();
    }
  };

  private onDateInput(event: CustomEvent) {
    event.stopPropagation();
    const value = event.detail.value as DateRange[] | undefined;
    for (const range of value ?? []) {
      const error = this.rangeError(range);
      if (error) {
        this.rejectTypedRange(range, error);
        return;
      }
    }
    this.commitValue(value, false);
  }

  /** The input committed a typed range (Enter), unless {@link onDateInput} rejected it. */
  private onDateChange(event: CustomEvent) {
    event.stopPropagation();
    if (this._invalidRange) return;
    this.setWorking(undefined, undefined);
    dispatchChange(this, this.value ?? null);
  }

  /** The message for the first constraint a range violates, or null when valid. */
  private rangeError(range: DateRange): string | null {
    const start = range.start;
    const end = range.end ?? range.start;
    // A disabled day anywhere in the span — not just at the endpoints.
    if (rangeSpansDisabledDay(start, end, this.disabledRanges)) {
      return message('disabledDateRange', this.disabledDateRangeMessage);
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
    this.setWorking(undefined, undefined);
    const input = this._dateRef;
    if (!input) return;

    input.value = this.value ?? [];
    input.showRange(start, end);
    input.surfaceHostError(message);
  }

  /**
   * The input's per-part blur stays inside the widget: moving from a segment
   * into the popover is not leaving the control, so it must not be reported
   * as a blur (which the form layer reads as "validate now"). The picker
   * reports blur from its own focus-leave check instead.
   */
  private onDateBlur(event: Event) {
    event.stopPropagation();
  }

  private onCalendarChange(event: CustomEvent) {
    event.stopPropagation();
    this._dateRef?.clearRangeInputs();
    this.commitValue(event.detail.value);
  }

  /**
   * Applies a new working range, repainting only the endpoints that actually
   * changed. Repainting every reported endpoint would wipe half-typed
   * segments the other half of the widget never saw; skipping the unchanged
   * ones also keeps the caret out of the way while the user types.
   */
  private setWorking(start?: string, end?: string, paint = false): void {
    const startChanged = start !== this._workingStart;
    const endChanged = end !== this._workingEnd;
    this._workingStart = start;
    this._workingEnd = end;

    if (!paint) return;
    if (startChanged) this._dateRef?.fillGroup('start', start ?? null);
    if (endChanged) this._dateRef?.fillGroup('end', end ?? null);
  }

  /** Typed endpoints feed the working range; the calendar follows them. */
  private onInputPartsChange(event: CustomEvent<{ start: string | null; end: string | null }>) {
    event.stopPropagation();
    this.setWorking(event.detail.start ?? undefined, event.detail.end ?? undefined);
  }

  /**
   * The calendar's in-progress selection, held here so it survives the
   * popover, and painted into the fields so a picked day reads back as a date
   * — the reverse of typed parts moving the calendar's selection.
   */
  private onCalendarPartsChange(
    event: CustomEvent<{ anchor: string | null; start: string | null; end: string | null }>,
  ) {
    event.stopPropagation();
    const { anchor, start, end } = event.detail;

    if (start || end) {
      this.setWorking(start ?? undefined, end ?? undefined, true);
      return;
    }

    if (anchor) {
      if (!this._workingStart && this._workingEnd === anchor) return;
      this.setWorking(anchor, undefined, true);
      return;
    }

    this.setWorking(undefined, undefined, true);
  }

  private onCalendarInputError(event: CustomEvent) {
    const range = event.detail?.range as { start: string; end: string } | undefined;
    if (!range) return;
    this._invalidRange = range;
    this._dateRef?.showRange(range.start, range.end);
  }

  /**
   * The single funnel every commit passes through — a calendar span, a typed
   * Enter — so the working selection is torn down once, and the calendar
   * (which follows the cleared props) with it. `committed` is false for typed
   * values until the input commits them (see {@link onDateChange}), and for
   * the input's error-clearing echo, which carries no new pill and must leave
   * a half-entered range alone.
   */
  private commitValue(value: DateRange[] | null | undefined, committed = true) {
    this.value = value ?? undefined;
    this._invalidRange = null;
    if (committed) this.setWorking(undefined, undefined);
    dispatchValue(this, value ?? null, { commit: committed });
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

  private onPillClick(event: CustomEvent) {
    this._focusDate = event.detail.range.start;
    this._popup.show();
  }

  private onEditStateChange = (
    event: CustomEvent<{ selected: DateRange | null; editing: boolean }>,
  ) => {
    this._selectedEditRange = event.detail.selected;
    this._editing = event.detail.editing;
  };

  /**
   * Escape layering: an open popup consumes the key first (closing the
   * popover), then the embedded input's edit session gets its turn — cancel
   * an open session, then clear the selection.
   */
  private onWidgetKeyDown = (e: KeyboardEvent) => {
    if (this._popup.onAnchorKeyDown(e)) return;
    this._dateRef?.handleSessionEscape(e);
  };

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

safeDefine('gui-range-date-picker', GuiRangeDatePicker);
