import { html, LitElement, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import type { DateTimeRange } from '@golemui/gui-shared/internals';
import './range-date-time-input';
import './range-date-time-calendar';
import type { GuiRangeDateTimeInput } from './range-date-time-input';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIPopupController } from '../controllers/popup.controller';
import { type HourFormat } from '../utils/time';
import { addErrors, addIcon, addLabel, addPickerPanel } from '../utils/templates';

/** The four pieces of an in-progress range, each absent until chosen. */
interface WorkingRange {
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
}

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
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'day-count-aria-label' }) dayCountAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'disabled-day-count-aria-label' })
  disabledDayCountAriaLabel: string | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-edit' }) allowEdit: boolean | undefined = false;
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'edit-cancelled-message' }) editCancelledMessage:
    | string
    | undefined = undefined;

  @query('#date-input') private _dateRef?: GuiRangeDateTimeInput;

  /**
   * Mirror of the embedded input's edit session, fed by its non-bubbling
   * `editStateChange`: while a session is open the calendar defers commits to
   * the session's Confirm, and the selected range's days are marked.
   */
  @state() private _editing = false;
  @state() private _selectedEditRange: DateTimeRange | null = null;

  @state() private _focusDate: string | undefined = undefined;
  /**
   * The in-progress range, from either half of the widget: days and times
   * picked in the calendar, or endpoints typed into the input. It lives here —
   * the picker stays mounted — so a half-finished range survives closing and
   * reopening the popover, and it is what the calendar and the input each
   * render.
   */
  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  @state() private _workingStartTime: string | undefined = undefined;
  @state() private _workingEndTime: string | undefined = undefined;

  private _popup = new GUIPopupController(this, {
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
    beforeOpen: (popup) => {
      const dropdownWasOpen = !!this.querySelector('.gui-pills__dropdown');
      if (dropdownWasOpen) popup.suppressNextFocusOut();
      this.closePillsDropdown();
    },
    onOpenChanged: (open) => {
      // The working selection deliberately survives a close: only the
      // transient focus target is dropped.
      if (!open) this._focusDate = undefined;
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
      this.dispatchEvent(new CustomEvent('blur'));
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
      ? addPickerPanel(
          this.uid ?? '',
          { errors: this.errors, touched: this.touched, showErrors: this.showErrors },
          html`<gui-range-date-time-calendar
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
            .workingStart=${this._workingStart}
            .workingEnd=${this._workingEnd}
            .workingStartTime=${this._workingStartTime}
            .workingEndTime=${this._workingEndTime}
            .deferFocusLeave=${true}
            .selectedRange=${this._selectedEditRange}
            .deferCommit=${this._editing}
            @blur=${this.onCalendarBlur}
            @change=${this.onCalendarChange}
            @partsChange=${this.onCalendarPartsChange}
            @inputError=${this.onCalendarInputError}
          ></gui-range-date-time-calendar>`,
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
        @keydown=${this.onWidgetKeyDown}
        @click=${this._popup.onAnchorClick}
        @focusout=${this._focusLeave.onFocusOut}
      >
        <gui-range-date-time
          .deferFocusLeave=${true}
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
          .incompleteMessage=${this.incompleteMessage}
          .allowEdit=${this.allowEdit ?? false}
          .editLabel=${this.editLabel}
          .editAriaLabel=${this.editAriaLabel}
          .confirmEditLabel=${this.confirmEditLabel}
          .cancelEditLabel=${this.cancelEditLabel}
          .editStartedMessage=${this.editStartedMessage}
          .editCommittedMessage=${this.editCommittedMessage}
          .editCancelledMessage=${this.editCancelledMessage}
          @blur=${this.onDateBlur}
          @focus=${this._popup.show}
          @change=${this.onDateChange}
          @partsChange=${this.onInputPartsChange}
          @pillClick=${this.onPillClick}
          @editStateChange=${this.onEditStateChange}
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
    this.commitValue(event.detail.value, event.detail.commit !== false);
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

  /**
   * Applies a new working range, repainting only the pieces that actually
   * changed. Repainting every reported piece would wipe half-typed segments
   * the other half of the widget never saw — a `11:3` in the start time is
   * lost the moment the calendar reports it has no start time at all.
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

    const input = this._dateRef;
    if (!paint || !input) return;
    if (changed.start) input.fillDate('start', next.start ?? null);
    if (changed.end) input.fillDate('end', next.end ?? null);
    if (changed.startTime) input.fillTime('start', next.startTime ?? null);
    if (changed.endTime) input.fillTime('end', next.endTime ?? null);
  }

  /** Typed endpoints feed the working range; the calendar follows them. */
  private onInputPartsChange(
    event: CustomEvent<{
      start: { date: string | null; time: string | null };
      end: { date: string | null; time: string | null };
    }>,
  ) {
    event.stopPropagation();
    const { start, end } = event.detail;
    this.setWorking({
      start: start.date ?? undefined,
      end: end.date ?? undefined,
      startTime: start.time ?? undefined,
      endTime: end.time ?? undefined,
    });
  }

  /**
   * The calendar's in-progress selection, held here so it survives the
   * popover, and painted into the fields so every piece picked in the calendar
   * reads back as a date-time — the reverse of typed parts moving the
   * calendar. Until the span completes its anchor stands in for the start day;
   * once the range commits every piece arrives null and the fields empty.
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

    if (start || end) {
      this.setWorking({ start, end, ...times }, true);
      return;
    }

    const keepEnd = !!anchor && !this._workingStart && this._workingEnd === anchor;
    this.setWorking(
      keepEnd
        ? { start: undefined, end: anchor, ...times }
        : { start: anchor, end: undefined, ...times },
      true,
    );
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

  /**
   * The single funnel every commit passes through — a calendar pick, a typed
   * Enter — so the working selection is torn down once, and the calendar
   * (which follows the cleared props, down to its two time pickers) with it.
   * `committed` is false for the input's error-clearing echo, which carries no
   * new pill and must leave a half-entered range alone.
   */
  private commitValue(value: DateTimeRange[] | null | undefined, committed = true) {
    this.value = value ?? undefined;
    if (committed) this.setWorking({});
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: value ?? null },
        bubbles: true,
        composed: true,
      }),
    );
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
    event: CustomEvent<{ selected: DateTimeRange | null; editing: boolean }>,
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
    'gui-range-date-time-picker': GuiRangeDateTimePicker;
  }
}

safeDefine('gui-range-date-time-picker', GuiRangeDateTimePicker);
