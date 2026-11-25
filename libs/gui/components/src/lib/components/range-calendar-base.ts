import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { booleanAttribute } from '../utils/converters';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUICalendarKeyboardController } from '../controllers/calendar-keyboard.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIMonthNavigationController } from '../controllers/month-navigation.controller';
import {
  getDayLabel,
  getFullDateLabel,
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
  idleRangeSelection,
  reduceRangeSelection,
  selectionPreviewSpan,
  workingPhase,
  type RangeSelectionState,
} from '../utils/range-selection';
import type { DateRange } from '../types';
import { GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dateRangesValidity } from '../utils/range-validity';
import { dispatch, dispatchBlur } from '../utils/events';
import { message } from '../utils/messages';

/** One day of a range calendar's grid, with how the ranges and the pick paint it. */
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
 * What the date range calendars share: the month grid and its navigation, the bounds and the
 * disabled days, the two-click pick, and the working endpoints a host picker holds while its
 * popup is closed. A subclass says which ranges the value holds, what a completed pick does to the
 * value, and what renders above the grid.
 */
export abstract class GuiRangeCalendarBase extends GuiFormControl {
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
  /** Error for a date inside `disabledRanges`. */
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  /** @internal */
  @property({ attribute: 'invalid-range' }) invalidRange: { start: string; end: string } | null =
    null;

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
      domId: this.domId,
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
      this.onFocusLeave();
      dispatchBlur(this);
    },
  });

  /** The ranges the value holds, in the order they were set. */
  protected abstract valueRanges(): DateRange[];

  /**
   * What a completed pick does: `start` and `end` are ordered, inside the bounds and clear of the
   * disabled days. The base has already cleared the rejected range and the in-progress pick.
   */
  protected abstract commitPick(start: Date, end: Date): void;

  /** The ranges painted on the grid. Defaults to the value's. */
  protected paintedRanges(): DateRange[] {
    return this.valueRanges();
  }

  /** A range whose days are marked apart from the others, such as one being edited. */
  protected markedRange(): DateRange | null {
    return null;
  }

  /** Runs when focus leaves the element, before `gui-blur`. */
  protected onFocusLeave(): void {
    // Nothing by default.
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
   * Midnight-truncated calendar day of an endpoint, used to highlight the day
   * grid.
   */
  protected endpointDay(iso: string): Date {
    return parseISODateString(iso);
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
  }

  override willUpdate(changedProperties: PropertyValues): void {
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
      } else {
        const first = this.valueRanges()[0];
        if (first?.start) {
          this._nav.navigateToDate(this.endpointDay(first.start));
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
    return dateRangesValidity(this.valueRanges(), this) ?? super.validate();
  }

  override render() {
    return renderCalendarChrome({
      ids: this,
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

  /**
   * What renders above the month grid. Default: nothing.
   *
   * @internal
   */
  renderAboveCalendar(): TemplateResult | typeof nothing {
    return nothing;
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

  /** A thin override point for a subclass that must do more when the year grid toggles. */
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
    const ranges = this.paintedRanges().map((range) => ({
      start: this.endpointDay(range.start),
      end: range.end ? this.endpointDay(range.end) : undefined,
    }));
    const selectingSpan = selectionPreviewSpan(this._selection) ?? this.workingSpan ?? null;
    const markedRange = this.markedRange();
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
        ...this.valueRanges().map((range) => this.endpointDay(range.start)),
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

    this._invalidRange = null;
    this.commitPick(commit.start, commit.end);
  }

  protected onMouseOver(day: RangeCalendarDay) {
    if (day.isDisabled) return;

    this._selection = reduceRangeSelection(this._selection, {
      type: 'hover',
      date: day.date,
    }).state;
  }

  protected navigateToDate(isoDate: string) {
    this._nav.navigateToDate(this.endpointDay(isoDate));
  }
}
