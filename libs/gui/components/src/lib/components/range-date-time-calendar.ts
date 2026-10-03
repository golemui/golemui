import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUICalendarKeyboardController } from '../controllers/calendar-keyboard.controller';
import { GUIEditSessionController } from '../controllers/edit-session.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIMonthNavigationController } from '../controllers/month-navigation.controller';
import type { RangeCalendarDay } from './range-calendar';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import './time-picker';
import type { GuiTime } from './time-input';
import type { GuiTimePicker } from './time-picker';
import {
  getDayLabel,
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
import type { DateTimeRange } from '../types';
import { GuiFormControl } from '../gui-form-control';
import {
  dispatch,
  dispatchBlur,
  dispatchInputError,
  dispatchValue,
  fires,
  stopPropagation,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, requiredName } from '../utils/messages';

/** A count bubble on a day: `text` is what the bubble and its hover label say. */
interface DayBadge {
  kind: 'day-count' | 'disabled-count';
  count: number;
  text: string;
  labels: string[];
}
/**
 * A calendar with start and end time pickers, to pick one or more date-time ranges.
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
 * @cssprop --gui-calendar-time-grid-height - Height of the time grid.
 * @cssprop --gui-calendar-time-button-height - Height of each time in the grid.
 * @cssprop --gui-range-bg - Background of the days inside a selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiRangeDateTimeCalendar extends GuiFormControl {
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
  /** Date-times that cannot be picked, as `{ start, end }` ISO date-time ranges. */
  @property({ type: Array, attribute: 'disabled-ranges' }) disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;
  /** Number of months shown side by side. */
  @property({ type: Number, attribute: 'number-of-months' }) numberOfMonths: number | undefined = 1;

  /** The date-time ranges, as `{ start, end }` ISO date-times. */
  @property({ type: Array }) value: DateTimeRange[] | undefined = [];
  /** @internal */
  @property({ type: String, attribute: 'focus-date' }) focusDate: string | undefined = undefined;
  /** @internal */
  @property({ type: Boolean, attribute: 'hide-pills' }) hidePills = false;
  /** Accessible name of the remove button of each range pill. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /** Error for a range that steps over a disabled day. Defaults to `disabledRangeMessage`. */
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  /** @internal */
  @property({ attribute: 'invalid-range' }) invalidRange: { start: string; end: string } | null =
    null;

  /** 12- or 24-hour clock. Defaults to the locale's. */
  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  /** Minutes between the times offered in the list. */
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  /** Allows typing any time, not only picking one from the list. */
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  /** Label of the start time. An empty value keeps the default. */
  @property({ type: String, attribute: 'start-time-label' }) startTimeLabel: string | undefined =
    undefined;
  /** Label of the end time. An empty value keeps the default. */
  @property({ type: String, attribute: 'end-time-label' }) endTimeLabel: string | undefined =
    undefined;
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
   * Read with a day that has several ranges, before the ranges themselves. `{count}` is the number
   * of ranges.
   */
  @property({ type: String, attribute: 'day-count-aria-label' }) dayCountAriaLabel:
    | string
    | undefined = undefined;
  /**
   * Read with a day that has disabled times, before the times themselves. `{count}` is the number
   * of disabled ranges.
   */
  @property({ type: String, attribute: 'disabled-day-count-aria-label' })
  disabledDayCountAriaLabel: string | undefined = undefined;
  /**
   * The host picker's working selection — typed into its input, or picked here
   * and held there across the popover's unmount/remount cycle. One date
   * renders as an in-progress anchor, both as a parked span.
   */
  @property({ type: String, attribute: 'working-start' }) workingStart: string | undefined =
    undefined;
  /** @internal */
  @property({ type: String, attribute: 'working-end' }) workingEnd: string | undefined = undefined;
  /** @internal */
  @property({ type: String, attribute: 'working-start-time' }) workingStartTime:
    | string
    | undefined = undefined;
  /** @internal */
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
  /**
   * The host picker's allowEdit-selected range: its days are marked so the
   * range being inspected or edited stands out among its neighbors.
   */
  @property({ attribute: 'selected-range' }) selectedRange: DateTimeRange | null = null;
  /**
   * Set by a host picker while an edit session is open: completed pieces park
   * as working state instead of committing — the session's explicit Confirm
   * owns the commit.
   */
  @property({ type: Boolean, attribute: 'defer-commit' }) deferCommit = false;

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
    getMinDate: () => this.minDay,
    getMaxDate: () => this.maxDay,
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

  /**
   * Leaving settles the working selection before blurring. Only a deliberate
   * pick attempts a commit as it happens, so four pieces completed by typing a
   * custom time sit here uncommitted — and leaving is as deliberate as Enter.
   */
  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      if (!this.deferFocusLeave) this.settleOnLeave();
      dispatchBlur(this);
    },
  });

  private _edit = new GUIEditSessionController<DateTimeRange>(this, {
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

  private get editEnabled(): boolean {
    return !!this.allowEdit && !this.disabled && !this.readOnly;
  }
  private loadRangeForEdit(range: DateTimeRange): void {
    const [startDay, startTime] = range.start.split('T');
    const [endDay, endTime] = (range.end ?? range.start).split('T');
    this._invalidRange = null;
    this._selection = idleRangeSelection();
    this._workingStart = startDay;
    this._workingEnd = endDay;
    this._workingStartTime = startTime;
    this._workingEndTime = endTime;
    this._nav.navigateToDate(this.endpointDay(range.start));
    this.emitPartsChange();
    void this.updateComplete.then(() => {
      this.querySelector<HTMLButtonElement>(
        `.gui-calendar__day-button[data-date="${startDay}"]`,
      )?.focus();
    });
  }

  private clearCompose(): void {
    this.resetWorking();
    this.emitPartsChange();
  }

  /**
   * A completed working range commits (or surfaces its own rejection). A
   * half-finished one — any piece left behind: a span, a lone anchor day, a
   * parked time, or a half-typed time that never emitted — surfaces the
   * incomplete message; the committed pills are untouched, the injected
   * issue alone flags the field. An emptied selection instead clears a
   * message surfaced earlier.
   */
  private settleOnLeave(): void {
    if (this._edit.editing) {
      const outcome = this.commitWorking(this._edit.baseRanges(this.value));
      if (outcome.kind === 'committed') {
        this._edit.completed(outcome.start, { focus: false });
      }
      if (this._edit.editing) this._edit.cancel();
      this._edit.handleFocusLeave();
      return;
    }
    this._edit.handleFocusLeave();

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

    this.emitInputError(message('incompleteDateTime', this.incompleteMessage));
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
    this.addEventListener('keydown', this.onHostKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onHostKeyDown);
  }

  /**
   * Escape layering below the year grid and the time-picker lists (which
   * consume their own Escape while open): first cancels an open edit session,
   * then clears the selection.
   */
  private onHostKeyDown = (e: KeyboardEvent) => {
    this._edit.handleEscape(e);
  };

  override willUpdate(changedProperties: PropertyValues): void {
    this._edit.reconcileValue(this.value);
    this.adoptWorkingSelection(changedProperties);
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
          disabled: this.disabled,
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
            .uid=${`${this.uid}-start-time`}
            .label=${requiredName('startTime', this.startTimeLabel)}
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
            @gui-input=${this.onStartTimeInput}
            @gui-change=${this.onTimeChange}
            @gui-blur=${stopPropagation}
            @gui-input-error=${this.onTimeInputError}
            @gui-list-toggle=${(e: CustomEvent<{ open: boolean }>) => this.onListToggle(e, 'start')}
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
            .uid=${`${this.uid}-end-time`}
            .label=${requiredName('endTime', this.endTimeLabel)}
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
            @gui-input=${this.onEndTimeInput}
            @gui-change=${this.onTimeChange}
            @gui-blur=${stopPropagation}
            @gui-input-error=${this.onTimeInputError}
            @gui-list-toggle=${(e: CustomEvent<{ open: boolean }>) => this.onListToggle(e, 'end')}
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
      weekdayFormat: this.weekdayFormat,
      disabled: this.disabled,
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

  /** The first selectable day: `minDate` or the day of `minDateTime`, whichever is later. */
  private get minDay(): string | undefined {
    return [this.minDate, this.minDateTime?.split('T')[0]]
      .filter((day): day is string => !!day)
      .sort()
      .pop();
  }

  /** The last selectable day: `maxDate` or the day of `maxDateTime`, whichever is earlier. */
  private get maxDay(): string | undefined {
    return [this.maxDate, this.maxDateTime?.split('T')[0]]
      .filter((day): day is string => !!day)
      .sort()[0];
  }

  /**
   * A day is unclickable only when a span covers it entirely.
   */
  protected isDisabled(date: Date): boolean {
    const day = toISODateString(date);
    if (isDateDisabled(day, this.minDay, this.maxDay)) return true;
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
      isEditSelected: false,
      isEditMuted: false,
    };
  }

  /** @internal */
  renderDay(day: RangeCalendarDay): TemplateResult {
    const isInvalidSingle = day.isInvalidStart && day.isInvalidEnd;
    const badges = this.dayBadges(day);
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
        aria-description=${badges.length ? badges.map((badge) => badge.text).join('. ') : nothing}
        aria-current=${day.isToday ? 'date' : nothing}
        data-date=${toISODateString(day.date)}
        @click=${(e: MouseEvent) => this.selectDate(day, e)}
        @mouseover=${() => this.onMouseOver(day)}
        @focus=${() => this.onMouseOver(day)}
        @keydown=${(e: KeyboardEvent) => this._keyboard.handleDayKeydown(e)}
        aria-selected=${day.isRangeStart || day.isRangeEnd || day.isInRange ? 'true' : 'false'}
      >
        ${this.renderDayContent(day, badges)}
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
      this.emitInputError(
        message('disabledDateRange', this.disabledDateRangeMessage ?? this.disabledRangeMessage),
      );
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

  private onStartTimeInput(event: CustomEvent) {
    this.onTimeInput(event, 'start');
  }

  private onEndTimeInput(event: CustomEvent) {
    this.onTimeInput(event, 'end');
  }

  /**
   * Both endpoints follow one rule: the value is always kept as working state
   * (so it survives and syncs), but only a deliberate selection — a list pick
   * or Enter — attempts the commit, see {@link onTimeChange}. Typing a custom
   * time must never create an unintended pill.
   */
  private onTimeInput(event: CustomEvent, endpoint: 'start' | 'end') {
    event.stopPropagation();

    const time = (event.detail.value as string | null) ?? undefined;
    if (endpoint === 'start') {
      this._workingStartTime = time;
    } else {
      this._workingEndTime = time;
    }
    this.emitPartsChange();
  }

  /** A deliberate time pick, whose value {@link onTimeInput} already holds. */
  private onTimeChange(event: CustomEvent) {
    event.stopPropagation();
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
    if (this.deferCommit || this._edit.editing) return false;
    return this.commitWorking(this.value ?? []).kind !== 'incomplete';
  }

  private commitWorking(
    base: DateTimeRange[],
  ): { kind: 'committed'; start: string } | { kind: 'incomplete' | 'rejected' | 'unchanged' } {
    const startDate = this._workingStart;
    const endDate = this._workingEnd;
    const timeIn = this._workingStartTime;
    const timeOut = this._workingEndTime;
    if (!startDate || !endDate || !timeIn || !timeOut) return { kind: 'incomplete' };

    const startError = this.timeError(timeIn, startDate, this.resolvedStartTimeRanges);
    if (startError) {
      this.emitInputError(startError);
      return { kind: 'rejected' };
    }

    const endError = this.timeError(timeOut, endDate, this.resolvedEndTimeRanges);
    if (endError) {
      this.emitInputError(endError);
      return { kind: 'rejected' };
    }

    const ordered = orderDateTimeRange(`${startDate}T${timeIn}`, `${endDate}T${timeOut}`);

    if (dateTimeRangeOverlaps(ordered, this.disabledRanges)) {
      this.emitInputError(message('disabledDateRange', this.disabledRangeMessage));
      return { kind: 'rejected' };
    }

    const next = mergeDateTimeRanges([...base, ordered]);
    if (
      this._edit.editing &&
      sameRanges(
        this.getSortedPills(),
        sortRangesByStart(
          next,
          (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
        ),
      )
    ) {
      return { kind: 'unchanged' };
    }

    this._skipValueNavigation = true;
    this.value = next;
    this.resetWorking();
    this.emitPartsChange();
    this.emitChange(next);
    return { kind: 'committed', start: ordered.start };
  }

  /** Whether a `gui-input-error` has been emitted and not yet cleared by a change. */
  private _surfacedError = false;

  private emitChange(value: DateTimeRange[]): void {
    // The form layer clears injected issues on every change, so the mirror
    // flag resets with it.
    this._surfacedError = false;
    dispatchValue(this, value);
  }

  /**
   * Live-syncs the in-progress selection to a host picker, which holds it
   * across the popover's unmount/remount cycle. Never wired by the form
   * layer, so it can't trigger validation.
   */
  private emitPartsChange(): void {
    dispatch(this, 'gui-parts-change', {
      anchor: this.anchorISO() ?? null,
      start: this._workingStart ?? null,
      end: this._workingEnd ?? null,
      startTime: this._workingStartTime ?? null,
      endTime: this._workingEndTime ?? null,
    });
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
      return message('disabledDateRange', this.disabledRangeMessage);
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
   * A time picker's rejection of a typed time (out of the day's bounds, on a
   * disabled slot) is reported as this calendar's own, so it shows while the
   * user types.
   */
  private onTimeInputError(event: CustomEvent<GuiInputErrorEventDetail>) {
    stopPropagation(event);
    dispatchInputError(this, event.detail.message);
  }

  private emitInputError(message: string) {
    this._surfacedError = true;
    dispatchInputError(this, message);
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

  protected renderDayContent(day: RangeCalendarDay, badges: DayBadge[]): TemplateResult {
    if (!badges.length) return html`${day.dayLabel}`;

    // One shared corner row: when a day has both a selection count and a
    // disabled count, the bubbles stack side by side instead of fighting for
    // the corner.
    return html`${day.dayLabel}<span class="gui-range-date-time-calendar__badges"
        >${badges.map((badge) => this.renderBadge(badge))}</span
      >`;
  }

  /** The count bubbles of a day: the day button reads their text as its description. */
  private dayBadges(day: RangeCalendarDay): DayBadge[] {
    return [this.rangeCountBadge(day), this.disabledSlotsBadge(day)].filter(
      (badge): badge is DayBadge => !!badge,
    );
  }

  /**
   * Renders a count bubble plus its hover label as SIBLINGS (the label must not
   * live inside the count span — the bubble shows only the number). Both are
   * visual: the day button's description carries their text.
   */
  private renderBadge(badge: DayBadge): TemplateResult {
    return html`<span class="gui-range-date-time-calendar__${badge.kind}" aria-hidden="true"
        >${badge.count}</span
      ><span class="gui-range-date-time-calendar__badge-tooltip" aria-hidden="true"
        >${badge.labels.map((label) => html`<span>${label}</span>`)}</span
      >`;
  }

  private rangeCountBadge(day: RangeCalendarDay): DayBadge | null {
    if (!day.isCurrentMonth) return null;
    const ranges = this.rangesOnDay(day.date);
    if (ranges.length <= 1) return null;

    const labels = ranges.map((range) => this.formatPillLabel(range));
    const text = `${message('dayRangeCount', this.dayCountAriaLabel, {
      count: ranges.length,
    })}: ${labels.join(', ')}`;
    return { kind: 'day-count', count: ranges.length, text, labels };
  }

  private disabledSlotsBadge(day: RangeCalendarDay): DayBadge | null {
    if (!day.isCurrentMonth || day.isDisabled) return null;
    const slots = resolveDisabledTimesForDate(this.disabledRanges, toISODateString(day.date));
    if (!slots.length) return null;

    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const labels = slots.map(
      (slot) =>
        `${formatISOTimeForLocale(slot.start, this.localeId, hourFormat)} – ${formatISOTimeForLocale(
          slot.end,
          this.localeId,
          hourFormat,
        )}`,
    );
    const text = `${message('disabledTimeRangeCount', this.disabledDayCountAriaLabel, {
      count: slots.length,
    })}: ${labels.join(', ')}`;
    return { kind: 'disabled-count', count: slots.length, text, labels };
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
        .toolbarAriaLabel=${message('selectedDateTimeRanges')}
        .items=${pillItems}
        .removable=${true}
        .clickable=${true}
        .bubble=${false}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        .removeAriaLabel=${requiredName('removeDateTime', this.removePillAriaLabel)}
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
   * live-previews the working pieces, and every pill carries the interpolated
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

  /** The live label of the range being reshaped, one `…` per incomplete endpoint. */
  private workingLabel(): string {
    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const format = (day: string | undefined, time: string | undefined) =>
      day && time ? formatISODateTimeForLocale(`${day}T${time}`, this.localeId, hourFormat) : '…';
    return `${format(this._workingStart, this._workingStartTime)} - ${format(
      this._workingEnd,
      this._workingEndTime,
    )}`;
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    this.emitChange(removal.next);
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
   * session keeps its selection — its focus legitimately lives in the day grid
   * or the time pickers.
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
    const outcome = this.commitWorking(this._edit.baseRanges(this.value));
    if (outcome.kind === 'committed') {
      this._edit.completed(outcome.start);
      return;
    }
    if (outcome.kind === 'unchanged') {
      this._edit.cancel();
      this._edit.focusSelectedPill();
      return;
    }
    if (outcome.kind === 'incomplete') {
      this.emitInputError(message('incompleteDateTime', this.incompleteMessage));
    }
  };

  private onPillEditCancel = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this._edit.cancel();
    this._edit.focusSelectedPill();
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

/** The events `gui-range-date-time-calendar` fires, with their types. */
export const GuiRangeDateTimeCalendarEvents = {
  ...valueEvents<GuiRangeDateTimeCalendar['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<
    CustomEvent<{
      anchor: string | null;
      start: string | null;
      end: string | null;
      startTime: string | null;
      endTime: string | null;
    }>
  >(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time-calendar': GuiRangeDateTimeCalendar;
  }
}

safeDefine('gui-range-date-time-calendar', GuiRangeDateTimeCalendar);
