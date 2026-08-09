import { html, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateTimeRange } from '@golemui/gui-shared/internals';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUICalendarKeyboardController } from '../controllers/calendar-keyboard.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIMonthNavigationController } from '../controllers/month-navigation.controller';
import type { RangeCalendarDay } from './range-calendar';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import './time-picker';
import type { GuiTime } from './time-input';
import type { GuiTimePicker } from './time-picker';
import {
  getFullDateLabel,
  isDateDisabled,
  parseISODateString,
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
  removeRangeByKey,
  sortRangesByStart,
} from '../utils/pill-ranges';
import {
  idleRangeSelection,
  reduceRangeSelection,
  selectionPreviewSpan,
  workingPhase,
  type RangeSelectionState,
} from '../utils/range-selection';
import {
  dateTimeBoundsError,
  dateTimeRangeOverlaps,
  formatISODateTimeForLocale,
  formatISOTimeForLocale,
  isDayFullyBlocked,
  isTimeDisabled,
  mergeDateTimeRanges,
  oneStepAfterISOTime,
  orderDateTimeRange,
  parseISODateTimeString,
  resolveDisabledTimesForDate,
  resolveHourFormat,
  type HourFormat,
  type TimeRange,
} from '../utils/time';
import {
  DISABLED_DATE_RANGE_MESSAGE,
  INCOMPLETE_DATE_TIME_MESSAGE,
} from '../utils/messages';

@customElement('gui-range-date-time-calendar')
export class GuiRangeDateTimeCalendar extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;

  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = '';
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = '';
  @property({ type: String, attribute: 'select-year-aria-label' }) selectYearAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'year-grid-aria-label' }) yearGridAriaLabel:
    | string
    | undefined = undefined;
  @property({ type: String }) dayFormat: 'numeric' | '2-digit' | undefined = 'numeric';
  @property({ type: String }) weekdayFormat: 'short' | 'long' | 'narrow' | undefined = 'narrow';
  @property({ type: String }) monthFormat:
    | 'numeric'
    | '2-digit'
    | 'long'
    | 'short'
    | 'narrow'
    | undefined = 'long';
  @property({ type: String }) minDate: string | undefined = undefined;
  @property({ type: String }) maxDate: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  @property({ type: Number }) numberOfMonths: number | undefined = 1;

  @property({ type: Array }) value: DateTimeRange[] | undefined = [];
  @property({ type: String }) focusDate: string | undefined = undefined;
  @property({ type: Boolean }) hidePills = false;
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  @property({ attribute: false }) invalidRange: { start: string; end: string } | null = null;

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
  /**
   * The host picker's working selection — typed into its input, or picked here
   * and held there across the popover's unmount/remount cycle. One date
   * renders as an in-progress anchor, both as a parked span.
   */
  @property({ type: String, attribute: 'working-start' }) workingStart: string | undefined =
    undefined;
  @property({ type: String, attribute: 'working-end' }) workingEnd: string | undefined = undefined;
  @property({ type: String, attribute: 'working-start-time' }) workingStartTime:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'working-end-time' }) workingEndTime: string | undefined =
    undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving from this calendar into the picker's trigger is not leaving the
   * control, so the calendar leaves the commit to the host.
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  @state() protected _selection: RangeSelectionState = idleRangeSelection();
  @state() protected _invalidRange: { start: Date; end: Date } | null = null;

  @state() private _workingStart: string | undefined = undefined;
  @state() private _workingEnd: string | undefined = undefined;
  @state() private _workingStartTime: string | undefined = undefined;
  @state() private _workingEndTime: string | undefined = undefined;
  @state() private _openList: 'start' | 'end' | null = null;

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

  /** The nav controller's month cursor, kept under its historical name. */
  get _currentDate(): Date {
    return this._nav.currentDate;
  }

  set _currentDate(date: Date) {
    this._nav.currentDate = date;
  }

  /** The nav controller's year-grid flag; the time pickers close over it. */
  protected get _yearSelectorOpen(): boolean {
    return this._nav.yearSelectorOpen;
  }

  protected set _yearSelectorOpen(open: boolean) {
    this._nav.yearSelectorOpen = open;
  }

  protected ariaController: GUIAriaController<unknown, any> = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.gui-calendar-input`),
    getState: () => ({
      uid: this.uid as string,
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

  /**
   * Leaving settles the working selection before blurring. Only a deliberate
   * pick attempts a commit as it happens, so four pieces completed by typing a
   * custom time sit here uncommitted — and leaving is as deliberate as Enter.
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      if (!this.deferFocusLeave) this.settleOnLeave();
      this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
    },
  });

  /**
   * A completed working range commits (or surfaces its own rejection). A
   * half-finished one — any piece left behind: a span, a lone anchor day, a
   * parked time, or a half-typed time that never emitted — surfaces the
   * incomplete message; the committed pills are untouched, the injected
   * issue alone flags the field. An emptied selection instead clears a
   * message surfaced earlier.
   */
  private settleOnLeave(): void {
    if (this.tryCommitWorkingRange()) return;

    const leftBehind =
      !!this.anchorISO() ||
      !!this._workingStart ||
      !!this._workingEnd ||
      !!this._workingStartTime ||
      !!this._workingEndTime ||
      this.typedTimeCompleteness(this.startPicker) === 'partial' ||
      this.typedTimeCompleteness(this.endPicker) === 'partial';

    if (!leftBehind) {
      if (this._surfacedError) this.emitChange(this.value ?? []);
      return;
    }

    this.emitInputError(this.incompleteMessage ?? INCOMPLETE_DATE_TIME_MESSAGE);
  }

  /**
   * The fill state of an embedded picker's typed time input. A half-typed
   * time never emits, so it is visible only in the input's parts.
   */
  private typedTimeCompleteness(picker: GuiTimePicker | null) {
    return picker?.querySelector<GuiTime>('gui-time')?.groupCompleteness() ?? 'empty';
  }

  /**
   * Full instant of an endpoint, used to order the pills — endpoints carry a
   * time, so two ranges on the same day still sort by time.
   */
  protected parseEndpoint(iso: string): Date {
    return parseISODateTimeString(iso);
  }

  /**
   * Midnight-truncated calendar day of an endpoint, used to highlight the day
   * grid.
   */
  protected endpointDay(iso: string): Date {
    return parseISODateString(iso.split('T')[0]);
  }

  /** Pill text for one committed range. */
  protected formatPillLabel(range: DateTimeRange): string {
    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const start = formatISODateTimeForLocale(range.start, this.localeId, hourFormat);
    const end = range.end
      ? formatISODateTimeForLocale(range.end, this.localeId, hourFormat)
      : start;
    return `${start} - ${end}`;
  }

  protected get workingSpan(): DaySpan | undefined {
    if (!this._workingStart || !this._workingEnd) return undefined;
    return orderedDaySpan(
      parseISODateString(this._workingStart),
      parseISODateString(this._workingEnd),
    );
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override willUpdate(changedProperties: PropertyValues): void {
    this.adoptWorkingSelection(changedProperties);
    if (
      !this.hasUpdated ||
      changedProperties.has('minDateTime') ||
      changedProperties.has('maxDateTime')
    ) {
      this.minDate = this.minDateTime ? this.minDateTime.split('T')[0] : undefined;
      this.maxDate = this.maxDateTime ? this.maxDateTime.split('T')[0] : undefined;
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

  override render() {
    return renderCalendarChrome({
      uid: this.uid,
      label: this.label,
      hint: this.hint,
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
          onToggleYearSelector: () => this.toggleYearSelector(),
          renderBelowHeader: (panelOffset) => this.renderBelowHeader(panelOffset),
          renderPanelBody: (panelOffset) => this.renderPanelBody(panelOffset),
        }),
    });
  }

  protected renderBelowHeader(offset: number): TemplateResult | typeof nothing {
    if (offset !== 0) return nothing;

    const startEnabled = !this.disabled;
    const endEnabled = !this.disabled;
    const startBounds = this.startListBounds;
    const endBounds = this.endListBounds;

    const rowClasses = {
      'gui-range-date-time-calendar__time-row': true,
      'is-list-open': this._openList !== null,
    };

    return html`
      <div class=${classMap(rowClasses)}>
        <div
          class=${classMap({
            'gui-range-date-time-calendar__time-column': true,
            'is-open': this._openList === 'start',
          })}
        >
          <gui-time-picker
            class="gui-time-picker gui-field gui-range-date-time-calendar__start"
            .uid=${this.uid ? `${this.uid}-start-time` : undefined}
            .label=${this.startTimeLabel ?? 'Start time'}
            .showErrors=${false}
            .deferFocusLeave=${true}
            ?required=${this.required}
            ?disabled=${!startEnabled}
            ?readonly=${this.readOnly}
            .allowCustomTime=${this.allowCustomTime}
            .value=${this._workingStartTime}
            .localeId=${this.localeId}
            .hourFormat=${this.hourFormat}
            .minuteStep=${this.minuteStep}
            .minTime=${startBounds.minTime}
            .maxTime=${startBounds.maxTime}
            .disabledRanges=${this.resolvedStartTimeRanges}
            .columns=${4}
            .disabledRangeMessage=${this.disabledRangeMessage}
            .noAvailableTimesMessage=${this.noAvailableTimesMessage}
            @change=${this.onStartTimeChange}
            @partsChange=${this.stopInnerPartsChange}
            @listtoggle=${(e: CustomEvent<{ open: boolean }>) => this.onListToggle(e, 'start')}
          ></gui-time-picker>
        </div>

        <div
          class=${classMap({
            'gui-range-date-time-calendar__time-column': true,
            'is-open': this._openList === 'end',
          })}
        >
          <gui-time-picker
            class="gui-time-picker gui-field gui-range-date-time-calendar__end"
            .uid=${this.uid ? `${this.uid}-end-time` : undefined}
            .label=${this.endTimeLabel ?? 'End time'}
            .showErrors=${false}
            .deferFocusLeave=${true}
            ?required=${this.required}
            ?disabled=${!endEnabled}
            ?readonly=${this.readOnly}
            .allowCustomTime=${this.allowCustomTime}
            .value=${this._workingEndTime}
            .localeId=${this.localeId}
            .hourFormat=${this.hourFormat}
            .minuteStep=${this.minuteStep}
            .minTime=${endBounds.minTime}
            .maxTime=${endBounds.maxTime}
            .disabledRanges=${this.resolvedEndTimeRanges}
            .columns=${4}
            .disabledRangeMessage=${this.disabledRangeMessage}
            .noAvailableTimesMessage=${this.noAvailableTimesMessage}
            @change=${this.onEndTimeChange}
            @partsChange=${this.stopInnerPartsChange}
            @listtoggle=${(e: CustomEvent<{ open: boolean }>) => this.onListToggle(e, 'end')}
          ></gui-time-picker>
        </div>
      </div>
    `;
  }

  protected renderPanelBody(offset: number): TemplateResult {
    // An open time list takes over the panel body (the day grid) like the
    // single date-time calendar does.
    if (this._openList && !this._yearSelectorOpen && offset === 0) {
      return html``;
    }
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
      getDays: (o) => this.getDaysInMonth(o),
      renderDay: (day) => this.renderDay(day),
    });
  }

  /** Closes the time pickers before delegating to the nav controller. */
  protected toggleYearSelector() {
    this.startPicker?.closeList();
    this.endPicker?.closeList();
    this._nav.toggleYearSelector();
  }

  /**
   * A day is unclickable only when a span covers it entirely.
   */
  protected isDisabled(date: Date): boolean {
    const day = toISODateString(date);
    if (isDateDisabled(day, this.minDate, this.maxDate)) return true;
    return isDayFullyBlocked(day, this.disabledRanges);
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
    };
  }

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
      disabled: day.isDisabled,
    };

    return html`
      <button
        type="button"
        role="gridcell"
        class=${classMap(classes)}
        tabindex=${day.isFocusable ? 0 : -1}
        ?disabled=${!day.isCurrentMonth}
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

  getDaysInMonth(offset: number): RangeCalendarDay[] {
    const ranges = (this.value ?? []).map((range) => ({
      start: this.endpointDay(range.start),
      end: range.end ? this.endpointDay(range.end) : undefined,
    }));
    const selectingSpan = selectionPreviewSpan(this._selection) ?? this.workingSpan ?? null;

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
        });

        return {
          date: base.date,
          dayLabel: base.dayLabel,
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
        };
      },
      focusFallbackDates: [
        new Date(),
        ...(this.value ?? []).map((range) => this.endpointDay(range.start)),
      ],
    });
  }

  selectDate(day: RangeCalendarDay, _e: MouseEvent | KeyboardEvent | null = null) {
    if (!day.isCurrentMonth || day.isDisabled || this.disabled || this.readOnly) return;

    const { state, commit } = reduceRangeSelection(this._selection, {
      type: 'pick',
      date: day.date,
    });
    this._selection = state;

    // Starting a new span drops the previous days but keeps the chosen times:
    // a time of day is independent of which days the range covers.
    if (!commit) {
      this._workingStart = undefined;
      this._workingEnd = undefined;
      this._invalidRange = null;
      this.emitPartsChange();
      return;
    }

    if (this.spanCoversBlockedDay(commit.start, commit.end)) {
      this._invalidRange = { start: commit.start, end: commit.end };
      this.emitInputError(this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE);
      this.requestUpdate();
      return;
    }

    this._invalidRange = null;
    this._workingStart = toISODateString(commit.start);
    this._workingEnd = toISODateString(commit.end);
    this.emitPartsChange();
    this.tryCommitWorkingRange();
  }

  private spanCoversBlockedDay(startDate: Date, endDate: Date): boolean {
    const iterator = new Date(startDate);
    iterator.setHours(0, 0, 0, 0);
    const limit = new Date(endDate);
    limit.setHours(0, 0, 0, 0);
    while (iterator <= limit) {
      if (this.isDisabled(iterator)) return true;
      iterator.setDate(iterator.getDate() + 1);
    }
    return false;
  }

  protected onMouseOver(day: RangeCalendarDay) {
    if (day.isDisabled) return;

    this._selection = reduceRangeSelection(this._selection, {
      type: 'hover',
      date: day.date,
    }).state;
  }

  private onStartTimeChange(event: CustomEvent) {
    this.onTimeChange(event, 'start');
  }

  private onEndTimeChange(event: CustomEvent) {
    this.onTimeChange(event, 'end');
  }

  /**
   * Both endpoints follow one rule: the value is always kept as working state
   * (so it survives and syncs), but only a deliberate selection — a list pick
   * or Enter — attempts the commit. Typing a custom time must never create an
   * unintended pill.
   */
  private onTimeChange(event: CustomEvent, endpoint: 'start' | 'end') {
    event.stopPropagation();

    const time = (event.detail.value as string | null) ?? undefined;
    if (endpoint === 'start') {
      this._workingStartTime = time;
    } else {
      this._workingEndTime = time;
    }
    this.emitPartsChange();

    if (event.detail.commit !== true) return;
    this.tryCommitWorkingRange();
  }

  /**
   * Commits once all four pieces are present, in whichever order they were
   * chosen. A rejected endpoint or span keeps every working value on show
   * next to its error, so the user corrects one piece instead of restarting.
   *
   * @return {boolean} Whether the attempt reported — a commit or a rejection
   *   error. False with pieces missing, where the caller decides what an
   *   unfinished selection means.
   */
  private tryCommitWorkingRange(): boolean {
    const startDate = this._workingStart;
    const endDate = this._workingEnd;
    const timeIn = this._workingStartTime;
    const timeOut = this._workingEndTime;
    if (!startDate || !endDate || !timeIn || !timeOut) return false;

    const startError = this.timeError(timeIn, startDate, this.resolvedStartTimeRanges);
    if (startError) {
      this.emitInputError(startError);
      return true;
    }

    const endError = this.timeError(timeOut, endDate, this.resolvedEndTimeRanges);
    if (endError) {
      this.emitInputError(endError);
      return true;
    }

    const ordered = orderDateTimeRange(`${startDate}T${timeIn}`, `${endDate}T${timeOut}`);

    if (dateTimeRangeOverlaps(ordered, this.disabledRanges)) {
      this.emitInputError(this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE);
      return true;
    }

    this._skipValueNavigation = true;
    const next = mergeDateTimeRanges([...(this.value ?? []), ordered]);
    this.value = next;
    this.resetWorking();
    this.emitPartsChange();
    this.emitChange(next);
    return true;
  }

  /** Whether an inputError has been emitted and not yet cleared by a change. */
  private _surfacedError = false;

  private emitChange(value: DateTimeRange[]): void {
    // The form layer clears injected issues on every change, so the mirror
    // flag resets with it.
    this._surfacedError = false;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }),
    );
  }

  /**
   * Live-syncs the in-progress selection to a host picker, which holds it
   * across the popover's unmount/remount cycle. Never wired by the form
   * layer, so it can't trigger validation.
   */
  private emitPartsChange(): void {
    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: {
          anchor: this.anchorISO() ?? null,
          start: this._workingStart ?? null,
          end: this._workingEnd ?? null,
          startTime: this._workingStartTime ?? null,
          endTime: this._workingEndTime ?? null,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Takes over the host picker's working selection: on the mount that follows
   * a popover reopen, and on every later change, so a value typed into the
   * picker's input reaches the days grid and the two time pickers. Adoption
   * compares values and never emits, so the picker echoing back what this
   * calendar just reported settles as a no-op instead of looping.
   */
  private adoptWorkingSelection(changedProperties: PropertyValues): void {
    if (changedProperties.has('workingStart') || changedProperties.has('workingEnd')) {
      this.adoptWorkingDates();
    }
    if (changedProperties.has('workingStartTime')) {
      this._workingStartTime = this.workingStartTime || undefined;
    }
    if (changedProperties.has('workingEndTime')) {
      this._workingEndTime = this.workingEndTime || undefined;
    }
  }

  /**
   * One date is an in-progress anchor the next click completes; both are the
   * parked span that waits for the times. Navigates to a span or anchor that
   * falls outside the visible months.
   */
  private adoptWorkingDates(): void {
    const phase = workingPhase(this.workingStart, this.workingEnd);

    if (phase.kind === 'span') {
      if (this._workingStart === phase.start && this._workingEnd === phase.end) return;
      this._workingStart = phase.start;
      this._workingEnd = phase.end;
      this._selection = idleRangeSelection();
      // The earliest endpoint, so a pair entered end-first still opens on the
      // beginning of its span.
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

  /** ISO day of the in-progress anchor, or undefined while idle. */
  private anchorISO(): string | undefined {
    return this._selection.anchor ? toISODateString(this._selection.anchor) : undefined;
  }

  /**
   * The error for a committed endpoint `time` on `isoDay`: out of the instant
   * window, or landing on a disabled slot.
   */
  private timeError(time: string, isoDay: string, disabledSlots: TimeRange[]): string | null {
    const bound = dateTimeBoundsError(`${isoDay}T${time}`, this.minDateTime, this.maxDateTime, {
      minDateTimeMessage: this.minDateTimeMessage,
      maxDateTimeMessage: this.maxDateTimeMessage,
    });
    if (bound) return bound;
    if (isTimeDisabled(time, disabledSlots)) {
      return this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE;
    }
    return null;
  }

  private resetWorking() {
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._workingStartTime = undefined;
    this._workingEndTime = undefined;
    this._selection = idleRangeSelection();
    this._openList = null;
    this.resetPicker(this.startPicker);
    this.resetPicker(this.endPicker);
  }

  private resetPicker(picker: GuiTimePicker | null) {
    if (!picker) return;
    picker.value = undefined;
    picker.closeList();
  }

  /**
   * The embedded time pickers' own segmented inputs broadcast a bubbling,
   * composed `partsChange` carrying only `{time}`. Left alone it reaches the
   * host picker's listener looking like this calendar's report, whose missing
   * keys read as "every piece is gone" and blank the working selection. The
   * times this calendar holds already flow out through `@change`.
   */
  private stopInnerPartsChange = (event: Event) => {
    event.stopPropagation();
  };

  private emitInputError(message: string) {
    this._surfacedError = true;
    this.dispatchEvent(
      new CustomEvent('inputError', { detail: { message }, bubbles: true, composed: true }),
    );
  }

  private get startPicker(): GuiTimePicker | null {
    return this.querySelector('gui-time-picker.gui-range-date-time-calendar__start');
  }

  private get endPicker(): GuiTimePicker | null {
    return this.querySelector('gui-time-picker.gui-range-date-time-calendar__end');
  }

  private pickerFor(which: 'start' | 'end'): GuiTimePicker | null {
    return which === 'start' ? this.startPicker : this.endPicker;
  }

  private onListToggle(event: CustomEvent<{ open: boolean }>, which: 'start' | 'end') {
    event.stopPropagation();
    const { open } = event.detail;
    if (open && this.readOnly) {
      this.pickerFor(which)?.closeList();
      return;
    }
    if (open) {
      this.pickerFor(which === 'start' ? 'end' : 'start')?.closeList();
      this._openList = which;
      this._yearSelectorOpen = false;
    } else if (this._openList === which) {
      this._openList = null;
    }
  }

  private get resolvedStartTimeRanges() {
    return this._workingStart
      ? resolveDisabledTimesForDate(this.disabledRanges, this._workingStart)
      : [];
  }

  private get resolvedEndTimeRanges() {
    return this._workingEnd
      ? resolveDisabledTimesForDate(this.disabledRanges, this._workingEnd)
      : [];
  }

  /** minTime/maxTime tightened by the instant bounds when this IS their day. */
  private dayClampedBounds(isoDay: string): { minTime?: string; maxTime?: string } {
    const bounds: { minTime?: string; maxTime?: string } = {};
    if (this.minDateTime && isoDay === this.minDateTime.split('T')[0]) {
      bounds.minTime = this.minDateTime.split('T')[1];
    }
    if (this.maxDateTime && isoDay === this.maxDateTime.split('T')[0]) {
      bounds.maxTime = this.maxDateTime.split('T')[1];
    }
    return bounds;
  }

  private get startListBounds(): { minTime?: string; maxTime?: string } {
    return this._workingStart ? this.dayClampedBounds(this._workingStart) : {};
  }

  private get endListBounds(): { minTime?: string; maxTime?: string } {
    if (!this._workingEnd) return {};
    const base = this.dayClampedBounds(this._workingEnd);
    if (this._workingEnd !== this._workingStart || !this._workingStartTime) return base;
    const floor = oneStepAfterISOTime(this._workingStartTime, this.minuteStep);
    if (!floor) return { minTime: '23:59:59', maxTime: '00:00:00' };
    return { minTime: floor, maxTime: base.maxTime };
  }

  protected renderDayContent(day: RangeCalendarDay): TemplateResult {
    const rangeBadge = this.renderRangeCountBadge(day);
    const disabledBadge = this.renderDisabledSlotsBadge(day);
    if (rangeBadge === nothing && disabledBadge === nothing) return html`${day.dayLabel}`;

    // One shared corner row: when a day has both a selection count and a
    // disabled count, the bubbles stack side by side instead of fighting for
    // the corner.
    return html`${day.dayLabel}<span class="gui-range-date-time-calendar__badges"
        >${rangeBadge}${disabledBadge}</span
      >`;
  }

  /**
   * Renders a count bubble plus its hover label as SIBLINGS (the label must not
   * live inside the count span — the bubble shows only the number).
   */
  private renderBadge(
    kind: 'day-count' | 'disabled-count',
    count: number,
    aria: string,
    labels: string[],
  ): TemplateResult {
    return html`<span class="gui-range-date-time-calendar__${kind}" aria-label=${aria}
        >${count}</span
      ><span class="gui-range-date-time-calendar__badge-tooltip" aria-hidden="true"
        >${labels.map((label) => html`<span>${label}</span>`)}</span
      >`;
  }

  private renderRangeCountBadge(day: RangeCalendarDay): TemplateResult | typeof nothing {
    if (!day.isCurrentMonth) return nothing;
    const ranges = this.rangesOnDay(day.date);
    if (ranges.length <= 1) return nothing;

    const labels = ranges.map((range) => this.formatPillLabel(range));
    const aria = `${(this.dayCountAriaLabel ?? '{count} ranges').replace(
      '{count}',
      String(ranges.length),
    )}: ${labels.join(', ')}`;
    return this.renderBadge('day-count', ranges.length, aria, labels);
  }

  private renderDisabledSlotsBadge(day: RangeCalendarDay): TemplateResult | typeof nothing {
    if (!day.isCurrentMonth || day.isDisabled) return nothing;
    const slots = resolveDisabledTimesForDate(this.disabledRanges, toISODateString(day.date));
    if (!slots.length) return nothing;

    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const labels = slots.map(
      (slot) =>
        `${formatISOTimeForLocale(slot.start, this.localeId, hourFormat)} – ${formatISOTimeForLocale(
          slot.end,
          this.localeId,
          hourFormat,
        )}`,
    );
    const aria = `${(this.disabledDayCountAriaLabel ?? '{count} disabled ranges').replace(
      '{count}',
      String(slots.length),
    )}: ${labels.join(', ')}`;
    return this.renderBadge('disabled-count', slots.length, aria, labels);
  }

  /** Committed ranges covering `date`, a range counts on every day of its span. */
  private rangesOnDay(date: Date): DateTimeRange[] {
    if (!this.value?.length) return [];
    const iso = toISODateString(date);
    return this.value.filter((range) => {
      const start = range.start.split('T')[0];
      const end = (range.end ?? range.start).split('T')[0];
      return iso >= start && iso <= end;
    });
  }

  // --- Pills ---

  renderAboveCalendar(): TemplateResult | typeof nothing {
    if (this.hidePills) return nothing;

    const pills = this.getSortedPills();
    if (pills.length === 0) return nothing;

    const pillItems: GuiPillItem[] = buildPillItems(pills, (pill) => this.formatPillLabel(pill));

    return html`
      <gui-pills
        class="gui-range-calendar__pills"
        .uid=${this.uid}
        .toolbarAriaLabel=${'Selected date-time ranges'}
        .items=${pillItems}
        .removable=${true}
        .clickable=${true}
        .bubble=${false}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date'}
        @pillremove=${this.onPillRemoveEvent}
        @pillclick=${this.onPillClickEvent}
      ></gui-pills>
    `;
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    this.emitChange(removal.next);
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (range) this.navigateToDate(range.start);
  };

  protected getSortedPills(): DateTimeRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
    );
  }

  protected navigateToDate(isoDate: string) {
    this._nav.navigateToDate(this.endpointDay(isoDate));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time-calendar': GuiRangeDateTimeCalendar;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-date-time-calendar')) {
  customElements.define('gui-range-date-time-calendar', GuiRangeDateTimeCalendar);
}
