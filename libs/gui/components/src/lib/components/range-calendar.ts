import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUICalendarKeyboardController } from '../controllers/calendar-keyboard.controller';
import { GUIEditSessionController } from '../controllers/edit-session.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIMonthNavigationController } from '../controllers/month-navigation.controller';
import {
  createDateRange,
  getDayLabel,
  getFullDateLabel,
  mergeDateRanges,
  parseISODateString,
  rangeSpansDisabledDay,
  toISODateString,
} from '../utils/date';
import {
  renderCalendarChrome,
  renderCalendarMonthPanel,
  renderCalendarPanelBody,
} from '../utils/calendar-templates';
import {
  buildMonthDays,
  computeDayStatus,
  orderedDaySpan,
  type DaySpan,
} from '../utils/day-status';
import {
  buildPillItems,
  findRangeByKey,
  formatISODateForDisplay,
  formatRangeLabel,
  removeRangeByKey,
  sameRanges,
  sortRangesByStart,
} from '../utils/pill-ranges';
import {
  idleRangeSelection,
  reduceRangeSelection,
  selectionPreviewSpan,
  workingPhase,
  type RangeSelectionState,
} from '../utils/range-selection';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import type { DateRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dateRangesValidity } from '../utils/range-validity';
import {
  stopPropagation,
  dispatch,
  dispatchBlur,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, requiredName } from '../utils/messages';

export interface RangeCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  isFocusable: boolean;
  dayLabel: string;
  isToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isOneDayRange: boolean;
  isAnchor: boolean;
  isSelecting: boolean;
  isInvalidStart: boolean;
  isInvalidEnd: boolean;
  isInvalidInRange: boolean;
  isEditSelected: boolean;
  isEditMuted: boolean;
}

/**
 * A calendar to pick one or more date ranges.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them.
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
export class GuiRangeCalendar extends GuiFormControl {
  /**
   * Whether the element renders its hint. Elements that embed it turn it off and show the hint
   * themselves: `aria-describedby` still points at the hint by its id.
   */
  @property({ attribute: 'show-hint', converter: booleanAttribute }) showHint: boolean | undefined =
    true;
  /** BCP 47 locale for formatting and parsing, such as `en-US` or `es`. */
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;

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
    | undefined = 'numeric';
  /** How weekday names are written in the header. */
  @property({ type: String, attribute: 'weekday-format' }) weekdayFormat:
    | 'short'
    | 'long'
    | 'narrow'
    | undefined = 'narrow';
  /** How the month is written in the header. */
  @property({ type: String, attribute: 'month-format' }) monthFormat:
    | 'numeric'
    | '2-digit'
    | 'long'
    | 'short'
    | 'narrow'
    | undefined = 'long';
  /** Earliest selectable date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String, attribute: 'min-date' }) minDate: string | undefined = undefined;
  /** Latest selectable date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String, attribute: 'max-date' }) maxDate: string | undefined = undefined;
  /** Dates that cannot be picked, as `{ start, end }` ISO date ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges: DateRange[] | undefined =
    undefined;
  /** Number of months shown side by side. */
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined = 1;

  /** The date ranges, as `{ start, end }` ISO dates. */
  @property({ type: Array }) value: DateRange[] | undefined = [];
  /** @internal */
  @property({ type: String, attribute: 'focus-date' }) focusDate: string | undefined = undefined;
  /**
   * The host picker's working endpoints — typed into its input, or picked here
   * and held there across the popover's unmount/remount cycle. One endpoint
   * renders as an in-progress anchor, both as a parked span.
   *
   * @internal
   */
  @property({ type: String, attribute: 'working-start' }) workingStart: string | undefined =
    undefined;
  /** @internal */
  @property({ type: String, attribute: 'working-end' }) workingEnd: string | undefined = undefined;
  /** @internal */
  @property({ attribute: 'hide-pills', converter: booleanAttribute }) hidePills:
    | boolean
    | undefined = false;
  /** Accessible name of the remove button of each range pill. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Error for a date inside `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  /** @internal */
  @property({ attribute: 'invalid-range' }) invalidRange: { start: string; end: string } | null =
    null;
  /**
   * The host picker's allowEdit-selected range: its days are marked so the
   * range being inspected or edited stands out among its neighbors.
   *
   * @internal
   */
  @property({ attribute: 'selected-range' }) selectedRange: DateRange | null = null;
  /**
   * Set by a host picker while an edit session is open: a completed two-click
   * span parks as the working selection (dotted preview) instead of merging
   * into the value — the session's explicit Confirm owns the commit.
   *
   * @internal
   */
  @property({ attribute: 'defer-commit', converter: booleanAttribute }) deferCommit:
    | boolean
    | undefined = false;

  /** Lets the user edit a range in place from its pill. */
  @property({ attribute: 'allow-edit', converter: booleanAttribute }) allowEdit:
    | boolean
    | undefined = false;
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

  @state() protected _selection: RangeSelectionState = idleRangeSelection();
  @state() protected _invalidRange: { start: Date; end: Date } | null = null;
  @state() protected _workingStart: string | undefined = undefined;
  @state() protected _workingEnd: string | undefined = undefined;

  protected _skipValueNavigation = false;

  /**
   * Month/year navigation state and guards, shared with the single calendar.
   * The controller requests host updates on every state change, replacing the
   * former `_currentDate`/`_yearSelectorOpen` reactive state.
   */
  protected _nav = new GUIMonthNavigationController(this, {
    getMinDate: () => this.minDate,
    getMaxDate: () => this.maxDate,
    getNumberOfMonths: () => this.numberOfMonths,
    getDisabledRanges: () => this.disabledRanges,
    onYearSelectorToggled: () => this._keyboard.onYearGridToggled(),
  });

  /**
   * The nav controller's month cursor, kept under its historical name.
   *
   * @internal
   */
  get _currentDate(): Date {
    return this._nav.currentDate;
  }

  /** @internal */
  set _currentDate(date: Date) {
    this._nav.currentDate = date;
  }

  protected ariaController: GUIAriaController<unknown, any> = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.gui-calendar-input`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
        required: this.required,
      },
    }),
  });

  private _keyboard = new GUICalendarKeyboardController(this, {
    canGoPrev: () => this._nav.canGoPrev(),
    canGoNext: () => this._nav.canGoNext(),
    goPrev: () => this._nav.prevMonth(),
    goNext: () => this._nav.nextMonth(),
    onActivateDay: (isoDate, event) => this.selectDate(this.activationDay(isoDate), event),
    onSelectYear: (year) => this._nav.selectYear(year),
    onCloseYearGrid: () => this._nav.closeYearSelector(),
    isYearGridOpen: () => this._nav.yearSelectorOpen,
  });

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      this.settleEditOnLeave();
      dispatchBlur(this);
    },
  });

  protected _edit = new GUIEditSessionController<DateRange>(this, {
    isEnabled: () => this.editEnabled,
    getRanges: () => this.value,
    compareStarts: (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
    formatLabel: (range) => this.formatPillLabel(range),
    loadRange: (range) => this.loadRangeForEdit(range),
    clearCompose: () => this.clearCompose(),
    getPills: () => this.querySelector('gui-pills'),
    getMessages: () => ({
      started: message('editRangeStarted', this.editStartedMessage),
      committed: message('editRangeCommitted', this.editCommittedMessage),
      cancelled: message('editRangeCancelled', this.editCancelledMessage),
    }),
  });

  protected get editEnabled(): boolean {
    return !!this.allowEdit && !this.disabled && !this.readOnly;
  }

  /** ISO day of the in-progress anchor, or undefined while idle. */
  protected anchorISO(): string | undefined {
    return this._selection.anchor ? toISODateString(this._selection.anchor) : undefined;
  }

  /**
   * Live-syncs the in-progress selection to a host picker, which holds it
   * across the popover's unmount/remount cycle and mirrors it into its input.
   * Never wired by the form layer, so it can't trigger validation.
   */
  protected emitWorkingChange(): void {
    dispatch(this, 'gui-parts-change', {
      anchor: this.anchorISO() ?? null,
      start: this._workingStart ?? null,
      end: this._workingEnd ?? null,
    });
  }

  protected get workingSpan(): DaySpan | undefined {
    if (!this._workingStart || !this._workingEnd) return undefined;
    return orderedDaySpan(this.endpointDay(this._workingStart), this.endpointDay(this._workingEnd));
  }

  protected adoptWorkingEndpoints(): void {
    const phase = workingPhase(this.workingStart, this.workingEnd);

    if (phase.kind === 'span') {
      if (this._workingStart === phase.start && this._workingEnd === phase.end) return;
      this._workingStart = phase.start;
      this._workingEnd = phase.end;
      this._selection = idleRangeSelection();
      this._nav.navigateToDate(this.workingSpan?.start ?? this.endpointDay(phase.start));
      return;
    }

    this._workingStart = undefined;
    this._workingEnd = undefined;

    if (phase.kind === 'idle') {
      if (this._selection.anchor) this._selection = idleRangeSelection();
      return;
    }

    if (this.anchorISO() === phase.iso) return;

    const anchor = this.endpointDay(phase.iso);
    if (isNaN(anchor.getTime())) return;
    this._selection = { anchor, hover: null, selecting: true };
    this._nav.navigateToDate(anchor);
  }

  /**
   * Full instant of an endpoint, used to order the pills. Date-only here; a
   * subclass whose endpoints carry a time overrides it so two ranges on the
   * same day still sort by time.
   */
  protected parseEndpoint(iso: string): Date {
    return parseISODateString(iso);
  }

  /**
   * Midnight-truncated calendar day of an endpoint, used to highlight the day
   * grid.
   */
  protected endpointDay(iso: string): Date {
    return parseISODateString(iso);
  }

  /** Pill text for one committed range. */
  protected formatPillLabel(range: DateRange): string {
    return formatRangeLabel(range, (iso) => formatISODateForDisplay(iso, this.localeId));
  }

  /** Day-button inner content. */
  protected renderDayContent(day: RangeCalendarDay): TemplateResult {
    return html`${day.dayLabel}`;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
    this.addEventListener('keydown', this.onHostKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onHostKeyDown);
  }

  /**
   * Escape layering below the year grid (which consumes its own Escape):
   * first cancels an open edit session, then clears the selection.
   */
  private onHostKeyDown = (e: KeyboardEvent) => {
    this._edit.handleEscape(e);
  };

  override willUpdate(changedProperties: PropertyValues): void {
    this._edit.reconcileValue(this.value);
    if (changedProperties.has('workingStart') || changedProperties.has('workingEnd')) {
      this.adoptWorkingEndpoints();
    }
    if (changedProperties.has('invalidRange')) {
      if (this.invalidRange) {
        const start = this.endpointDay(this.invalidRange.start);
        const end = this.endpointDay(this.invalidRange.end);
        this._invalidRange = isNaN(start.getTime()) || isNaN(end.getTime()) ? null : { start, end };
      } else {
        this._invalidRange = null;
      }
    }
    if (changedProperties.has('value') && !changedProperties.has('focusDate')) {
      if (this._skipValueNavigation) {
        this._skipValueNavigation = false;
      } else if (this.value) {
        const value = Array.isArray(this.value)
          ? this.value
          : [{ start: this.value as unknown as string }];

        if (value.length > 0 && value[0].start) {
          this._nav.navigateToDate(this.endpointDay(value[0].start));
        }
      }
    }
    if (changedProperties.has('focusDate')) {
      if (this.focusDate) {
        const date = parseISODateString(this.focusDate);
        if (!isNaN(date.getTime())) {
          this._nav.navigateToDate(date);
          // Reset so the same pill click triggers a change next time
          this.focusDate = undefined;
        }
      }
    }
  }

  /** A range outside `minDate`/`maxDate` or over a disabled day, then `required`. */
  protected override validate(): GuiValidity | null {
    return dateRangesValidity(this.value, this) ?? super.validate();
  }

  override render() {
    return renderCalendarChrome({
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      showHint: this.showHint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      numberOfMonths: this.numberOfMonths,
      localeId: this.localeId,
      currentDate: this._nav.currentDate,
      prevMonthIcon: this.prevMonthIcon,
      nextMonthIcon: this.nextMonthIcon,
      prevMonthAriaLabel: this.prevMonthAriaLabel,
      nextMonthAriaLabel: this.nextMonthAriaLabel,
      canGoPrev: this._nav.canGoPrev(),
      canGoNext: this._nav.canGoNext(),
      onPrevMonthClick: this._keyboard.onPrevMonthClick,
      onNextMonthClick: this._keyboard.onNextMonthClick,
      onFocusOut: this._focusLeave.onFocusOut,
      renderAboveCalendar: () => this.renderAboveCalendar(),
      renderMonthPanel: (offset) =>
        renderCalendarMonthPanel({
          currentDate: this._nav.currentDate,
          offset,
          localeId: this.localeId,
          monthFormat: this.monthFormat,
          yearSelectorOpen: this._nav.yearSelectorOpen,
          selectYearAriaLabel: this.selectYearAriaLabel,
          disabled: this.disabled,
          onToggleYearSelector: () => this.toggleYearSelector(),
          renderBelowHeader: (panelOffset) => this.renderBelowHeader(panelOffset),
          renderPanelBody: (panelOffset) => this.renderPanelBody(panelOffset),
        }),
    });
  }

  /** Hook rendered between the header and the panel body. Default: nothing. */
  protected renderBelowHeader(_offset: number): TemplateResult | typeof nothing {
    return nothing;
  }

  /**
   * The panel content below the header: the year grid replaces the days grid
   * of the first panel while the year selector is open. Subclasses can swap
   * in other bodies (e.g. the date-time calendar's time grid).
   */
  protected renderPanelBody(offset: number): TemplateResult {
    return renderCalendarPanelBody({
      offset,
      yearSelectorOpen: this._nav.yearSelectorOpen,
      years: this._nav.yearList,
      currentYear: this._nav.currentDate.getFullYear(),
      onSelectYear: (year) => this._keyboard.selectYear(year),
      onYearKeydown: this._keyboard.handleYearKeydown,
      localeId: this.localeId,
      currentDate: this._nav.currentDate,
      yearGridAriaLabel: this.yearGridAriaLabel,
      weekdayFormat: this.weekdayFormat,
      disabled: this.disabled,
      getDays: (o) => this.getDaysInMonth(o),
      renderDay: (day) => this.renderDay(day),
    });
  }

  /**
   * Kept as a thin override point — the range date-time subclass closes its
   * time pickers before delegating to the nav controller.
   */
  protected toggleYearSelector() {
    this._nav.toggleYearSelector();
  }

  protected isDisabled(date: Date): boolean {
    return this._nav.isDisabled(date);
  }

  /**
   * Rebuilds the day context for an Enter/Space activation from the button's
   * `data-date`. Legitimate because a day button can only be focused when it
   * is enabled and in-month; the `disabled`/`readOnly` guards stay in
   * `selectDate`.
   */
  private activationDay(isoDate: string): RangeCalendarDay {
    const date = parseISODateString(isoDate);
    return {
      date,
      isCurrentMonth: true,
      isDisabled: this.isDisabled(date),
      isFocusable: true,
      dayLabel: '',
      isToday: false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
      isOneDayRange: false,
      isAnchor: false,
      isSelecting: false,
      isInvalidStart: false,
      isInvalidEnd: false,
      isInvalidInRange: false,
      isEditSelected: false,
      isEditMuted: false,
    };
  }

  /** @internal */
  renderDay(day: RangeCalendarDay): TemplateResult {
    const isInvalidSingle = day.isInvalidStart && day.isInvalidEnd;
    const classes = {
      'gui-calendar__day-button': true,
      today: day.isToday,
      'other-month': !day.isCurrentMonth,
      'range-start': day.isRangeStart && !day.isOneDayRange,
      'range-end': day.isRangeEnd && !day.isOneDayRange,
      selected: day.isOneDayRange,
      'in-range': day.isInRange,
      'invalid-range-start': day.isInvalidStart && !isInvalidSingle,
      'invalid-range-end': day.isInvalidEnd && !isInvalidSingle,
      'invalid-range-single': isInvalidSingle,
      'invalid-in-range': day.isInvalidInRange,
      'is-anchor': day.isAnchor,
      'is-selecting': day.isSelecting,
      'edit-selected': day.isEditSelected,
      'range-muted': day.isEditMuted,
      disabled: day.isDisabled,
    };

    return html`
      <button
        type="button"
        role="gridcell"
        class=${classMap(classes)}
        tabindex=${day.isFocusable && !this.disabled ? 0 : -1}
        ?disabled=${!day.isCurrentMonth || this.disabled}
        aria-disabled=${day.isCurrentMonth && day.isDisabled ? 'true' : nothing}
        aria-label=${getFullDateLabel(this.localeId, day.date)}
        aria-current=${day.isToday ? 'date' : nothing}
        data-date=${toISODateString(day.date)}
        @click=${(e: MouseEvent) => this.selectDate(day, e)}
        @mouseover=${() => this.onMouseOver(day)}
        @focus=${() => this.onMouseOver(day)}
        @keydown=${(e: KeyboardEvent) => this._keyboard.handleDayKeydown(e)}
        aria-selected=${day.isRangeStart || day.isRangeEnd || day.isInRange ? 'true' : 'false'}
      >
        ${this.renderDayContent(day)}
      </button>
    `;
  }

  /** @internal */
  getDaysInMonth(offset: number): RangeCalendarDay[] {
    const ranges = (this.value ?? []).map((range) => ({
      start: this.endpointDay(range.start),
      end: range.end ? this.endpointDay(range.end) : undefined,
    }));
    const selectingSpan = selectionPreviewSpan(this._selection) ?? this.workingSpan ?? null;
    const markedRange = this.selectedRange ?? this._edit.selectedRange;
    const editSelectedSpan = markedRange
      ? orderedDaySpan(
          this.endpointDay(markedRange.start),
          this.endpointDay(markedRange.end ?? markedRange.start),
        )
      : null;

    return buildMonthDays({
      currentDate: this._currentDate,
      offset,
      localeId: this.localeId,
      numberOfMonths: this.numberOfMonths ?? 1,
      isDisabled: (date) => this.isDisabled(date),
      toDay: (base) => {
        const status = computeDayStatus(base.date, {
          ranges,
          anchor: this._selection.anchor,
          selectingSpan,
          invalidRange: this._invalidRange,
          editSelectedSpan,
        });

        return {
          date: base.date,
          dayLabel: getDayLabel(this.localeId, base.date, this.dayFormat),
          isCurrentMonth: base.isCurrentMonth,
          isToday: base.isToday,
          isRangeStart: status.isRangeStart,
          isRangeEnd: status.isRangeEnd,
          isInRange: status.isInRange,
          isInvalidStart: status.isInvalidStart && base.isCurrentMonth,
          isInvalidEnd: status.isInvalidEnd && base.isCurrentMonth,
          isInvalidInRange: status.isInvalidInRange && base.isCurrentMonth,
          isDisabled: base.isDisabled,
          isOneDayRange: status.isOneDayRange,
          isAnchor: status.isAnchor,
          isFocusable: base.isToday || status.isRangeStart,
          isSelecting: status.isSelecting && base.isCurrentMonth,
          isEditSelected: status.isEditSelected && base.isCurrentMonth,
          isEditMuted: status.isEditMuted && base.isCurrentMonth,
        };
      },
      focusFallbackDates: [
        new Date(),
        ...(this.value ?? []).map((range) => this.endpointDay(range.start)),
      ],
    });
  }

  /** @internal */
  selectDate(day: RangeCalendarDay, _e: MouseEvent | KeyboardEvent | null = null) {
    if (!day.isCurrentMonth || day.isDisabled || this.disabled || this.readOnly) return;

    const { state, commit } = reduceRangeSelection(this._selection, {
      type: 'pick',
      date: day.date,
    });
    this._selection = state;
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this.emitWorkingChange();

    // Start selection
    if (!commit) {
      // Starting over clears any previously rejected range still shown in red.
      this._invalidRange = null;
      return;
    }

    // A range that spans any disabled day is rejected, throw error, and no pill added.
    if (
      rangeSpansDisabledDay(
        toISODateString(commit.start),
        toISODateString(commit.end),
        this.disabledRanges,
        this.minDate,
        this.maxDate,
      )
    ) {
      this._invalidRange = { start: commit.start, end: commit.end };
      // The rejected span rides along so a host picker can show it in its input.
      dispatch(this, 'gui-input-error', {
        message: message('disabledDateRange', this.disabledDateRangeMessage),
        range: { start: toISODateString(commit.start), end: toISODateString(commit.end) },
      });
      this.requestUpdate();
      return;
    }

    if (this.deferCommit || this._edit.editing) {
      this._invalidRange = null;
      this._workingStart = toISODateString(commit.start);
      this._workingEnd = toISODateString(commit.end);
      this._selection = idleRangeSelection();
      this.emitWorkingChange();
      return;
    }

    this._invalidRange = null;
    this.commitWorking(commit.start, commit.end, this.value || []);
  }

  /** Merges one ordered span into `base` and emits the resulting value. */
  private commitWorking(start: Date, end: Date, base: DateRange[]): DateRange[] {
    this._skipValueNavigation = true;
    this.value = mergeDateRanges([...base, createDateRange(start, end)]);

    dispatchValue(this, this.value);
    return this.value;
  }

  protected onMouseOver(day: RangeCalendarDay) {
    if (day.isDisabled) return;

    this._selection = reduceRangeSelection(this._selection, {
      type: 'hover',
      date: day.date,
    }).state;
  }

  // --- Pills ---

  /** @internal */
  renderAboveCalendar(): TemplateResult | typeof nothing {
    const liveRegion = this.allowEdit
      ? html`<div class="gui-visually-hidden" aria-live="polite">${this._edit.announcement}</div>`
      : nothing;

    if (this.hidePills) return liveRegion;

    const pills = this.getSortedPills();
    if (pills.length === 0) return liveRegion;

    const pillItems: GuiPillItem[] = this.decoratePillItems(
      buildPillItems(pills, (pill) => this.formatPillLabel(pill)),
    );

    return html`
      ${liveRegion}
      <gui-pills
        class="gui-range-calendar__pills"
        .uid=${this.uid}
        .toolbarAriaLabel=${message('selectedDateRanges')}
        .items=${pillItems}
        .removable=${true}
        .clickable=${true}
        .bubble=${false}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        .removeAriaLabel=${requiredName('removeDate', this.removePillAriaLabel)}
        .editable=${this.editEnabled}
        .selectedKey=${this._edit.selectedKey ?? undefined}
        .editingKey=${this._edit.editing?.key ?? undefined}
        .editLabel=${requiredName('editRange', this.editLabel)}
        .confirmEditLabel=${requiredName('confirmEditRange', this.confirmEditLabel)}
        .cancelEditLabel=${requiredName('cancelEditRange', this.cancelEditLabel)}
        @gui-pill-remove=${this.onPillRemoveEvent}
        @gui-pill-click=${this.onPillClickEvent}
        @gui-pill-focus=${this.onPillFocusEvent}
        @gui-pills-blur=${this.onPillsBlurEvent}
        @gui-pill-edit=${this.onPillEditEvent}
        @gui-pill-edit-confirm=${this.onPillEditConfirm}
        @gui-pill-edit-cancel=${this.onPillEditCancel}
        @gui-pill-keydown=${stopPropagation}
        @gui-pill-exit=${stopPropagation}
      ></gui-pills>
    `;
  }

  /**
   * allowEdit decoration on the pill items: the editing pill's label
   * live-previews the working span, and every pill carries the interpolated
   * edit hint for its `aria-description`.
   */
  private decoratePillItems(items: GuiPillItem[]): GuiPillItem[] {
    if (!this.editEnabled) return items;
    const editingKey = this._edit.editing?.key;
    return items.map((item) => {
      const label = item.key === editingKey ? this.workingLabel() : item.label;
      return {
        ...item,
        label,
        ariaLabel: label,
        editAriaLabel: message('editRangeHint', this.editAriaLabel, { label: item.label }),
      };
    });
  }

  /** The live label of the span being re-picked, one `…` per empty endpoint. */
  private workingLabel(): string {
    const format = (iso: string | undefined) =>
      iso ? formatISODateForDisplay(iso, this.localeId) : '…';
    return `${format(this._workingStart)} - ${format(this._workingEnd)}`;
  }

  /**
   * Loads the pill's span as the parked working selection (dotted preview) and
   * moves focus to its start day, where re-picking begins.
   */
  private loadRangeForEdit(range: DateRange): void {
    this._invalidRange = null;
    this._selection = idleRangeSelection();
    this._workingStart = range.start;
    this._workingEnd = range.end ?? range.start;
    this._nav.navigateToDate(this.endpointDay(range.start));
    this.emitWorkingChange();
    void this.updateComplete.then(() => {
      this.querySelector<HTMLButtonElement>(
        `.gui-calendar__day-button[data-date="${range.start}"]`,
      )?.focus();
    });
  }

  private clearCompose(): void {
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._selection = idleRangeSelection();
    this.emitWorkingChange();
  }

  /**
   * Commits the parked working span as the replacement of the range being
   * edited. An unchanged result confirms-as-cancel; an incomplete span (a lone
   * anchor) leaves the session open, waiting for the second pick.
   */
  private commitEditFromWorking({ refocus = true }: { refocus?: boolean } = {}): void {
    const span = this.workingSpan;
    if (!span) return;

    const base = this._edit.baseRanges(this.value);
    const next = mergeDateRanges([...base, createDateRange(span.start, span.end)]);
    if (
      sameRanges(
        this.getSortedPills(),
        sortRangesByStart(
          next,
          (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
        ),
      )
    ) {
      this._edit.cancel();
      if (refocus) this._edit.focusSelectedPill();
      return;
    }

    const committedStart = toISODateString(span.start);
    this._invalidRange = null;
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._selection = idleRangeSelection();
    this.emitWorkingChange();
    this.commitWorking(span.start, span.end, base);
    this._edit.completed(committedStart, { focus: refocus });
  }

  /**
   * Focus left the calendar: a complete re-picked span is finished work and
   * commits as the replacement (without stealing focus back); anything less
   * cancels silently. The selection follows focus away in every case.
   */
  private settleEditOnLeave(): void {
    if (this._edit.editing) {
      this.commitEditFromWorking({ refocus: false });
      if (this._edit.editing) this._edit.cancel();
    }
    this._edit.handleFocusLeave();
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    dispatchValue(this, this.value);
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (!range) return;
    const outcome = this._edit.handlePillClick(e.detail.key);
    if (outcome === 'cancelled') return;
    this.navigateToDate(range.start);
  };

  /**
   * Keyboard navigation landed on a pill: the selection follows focus, so the
   * focused pill offers the edit affordance and drives the day marking.
   */
  private onPillFocusEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (!this.editEnabled || this._edit.editing) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
  };

  /**
   * Focus left the pills for elsewhere: the selection follows it away. An open
   * session keeps its selection — its focus legitimately lives in the day grid.
   */
  private onPillsBlurEvent = (e: Event) => {
    e.stopPropagation();
    if (this._edit.editing) return;
    this._edit.clearSelection();
  };

  /** Edit icon or F2 / E on a pill: select it (if needed) and start editing. */
  private onPillEditEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (!this.editEnabled || this._edit.editing?.key === e.detail.key) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
    this._edit.startEdit();
  };

  private onPillEditConfirm = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this.commitEditFromWorking();
  };

  private onPillEditCancel = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this._edit.cancel();
    this._edit.focusSelectedPill();
  };

  protected getSortedPills(): DateRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
    );
  }

  protected navigateToDate(isoDate: string) {
    this._nav.navigateToDate(this.endpointDay(isoDate));
  }
}

/** The events `gui-range-calendar` fires, with their types. */
export const GuiRangeCalendarEvents = {
  ...valueEvents<GuiRangeCalendar['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change':
    fires<CustomEvent<{ anchor: string | null; start: string | null; end: string | null }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-calendar': GuiRangeCalendar;
  }
}

safeDefine('gui-range-calendar', GuiRangeCalendar);
