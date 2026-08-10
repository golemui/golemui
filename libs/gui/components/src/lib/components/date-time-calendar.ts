import { html, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit/internals';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange, DisabledTimeRange } from '@golemui/gui-shared/internals';
import './time-picker';
import type { GuiTime } from './time-input';
import type { GuiTimePicker } from './time-picker';
import { GUIAriaController } from '../controllers/aria.controller';
import { GUICalendarKeyboardController } from '../controllers/calendar-keyboard.controller';
import { GUIFocusLeaveController } from '../controllers/focus-leave.controller';
import { GUIMonthNavigationController } from '../controllers/month-navigation.controller';
import {
  renderCalendarChrome,
  renderCalendarMonthPanel,
  renderCalendarPanelBody,
} from '../utils/calendar-templates';
import {
  getDayLabel,
  getFullDateLabel,
  isDateInVisibleMonths,
  isToday,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import { buildMonthDays, computeDayStatus } from '../utils/day-status';
import {
  INCOMPLETE_DATE_TIME_MESSAGE,
  INVALID_DISABLED_TIME_RANGE_MESSAGE,
} from '../utils/messages';
import { timeBoundsError } from '../utils/parts';
import {
  isTimeDisabled,
  parseISODateTimeString,
  resolveDisabledTimeRangesForDate,
  toISOTimeString,
  type HourFormat,
  type TimeRange,
} from '../utils/time';

export interface DateTimeCalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocusable: boolean;
  isDisabled: boolean;
}

export class GuiDateTimeCalendar extends LitElement {
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
  @property({ type: Array }) disabledRanges: DateRange[] | undefined = undefined;
  @property({ type: Number }) numberOfMonths: number | undefined = 1;

  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String, attribute: 'hour-format' }) hourFormat: HourFormat | undefined =
    undefined;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep: number | undefined = undefined;
  @property({ type: String, attribute: 'min-time' }) minTime: string | undefined = undefined;
  @property({ type: String, attribute: 'max-time' }) maxTime: string | undefined = undefined;
  @property({ type: Array, attribute: 'disabled-time-ranges' }) disabledTimeRanges:
    | DisabledTimeRange[]
    | undefined = undefined;
  @property({ type: String, attribute: 'min-time-message' }) minTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'max-time-message' }) maxTimeMessage: string | undefined =
    undefined;
  @property({ type: String, attribute: 'disabled-time-range-message' }) disabledTimeRangeMessage:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: 'no-available-times-message' }) noAvailableTimesMessage:
    | string
    | undefined = undefined;
  @property({ type: Boolean, attribute: 'allow-custom-time' }) allowCustomTime:
    | boolean
    | undefined = false;
  @property({ type: String, attribute: 'incomplete-message' }) incompleteMessage:
    | string
    | undefined = undefined;
  /**
   * Host picker's working (uncommitted) date/time halves. They seed the
   * internal selection whenever no committed value exists, so a partial
   * selection survives the popover unmount/remount cycle. A committed `value`
   * always takes precedence.
   */
  @property({ type: String, attribute: 'working-date' }) workingDate: string | undefined =
    undefined;
  @property({ type: String, attribute: 'working-time' }) workingTime: string | undefined =
    undefined;
  /**
   * Set by host pickers that run their own whole-widget focus-leave check:
   * moving focus from this calendar into the picker's input must not count as
   * leaving, so the embedded calendar skips its incomplete-on-leave handling
   * (the `blur` re-dispatch still fires — hosts close the popover with it).
   */
  @property({ type: Boolean, attribute: 'defer-focus-leave' }) deferFocusLeave:
    | boolean
    | undefined = false;

  @state() private _selectedDate: string | undefined = undefined;
  @state() private _selectedTime: string | undefined = undefined;
  @state() private _timeGridOpen = false;

  private _internalValueChange = false;

  /**
   * Month/year navigation state and guards, shared with the other calendars.
   * The controller requests host updates on every state change.
   */
  private _nav = new GUIMonthNavigationController(this, {
    getMinDate: () => this.minDate,
    getMaxDate: () => this.maxDate,
    getNumberOfMonths: () => this.numberOfMonths,
    getDisabledRanges: () => this.disabledRanges,
    onYearSelectorToggled: () => this._keyboard.onYearGridToggled(),
  });

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
    onActivateDay: (isoDate) => {
      const date = parseISODateString(isoDate);
      this.selectDate({
        date,
        dayLabel: getDayLabel(this.localeId, date),
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: false,
        isFocusable: true,
        isDisabled: this.isDisabled(date),
      });
    },
    onSelectYear: (year) => this._nav.selectYear(year),
    onCloseYearGrid: () => this._nav.closeYearSelector(),
    isYearGridOpen: () => this._nav.yearSelectorOpen,
  });

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
      if (this.deferFocusLeave) return;
      this.reportIncompleteOnLeave();
    },
  });

  /** The disabled time ranges in effect on the selected day. */
  private get resolvedTimeRanges(): TimeRange[] {
    return this._selectedDate
      ? resolveDisabledTimeRangesForDate(this.disabledTimeRanges, this._selectedDate)
      : [];
  }

  private get timePicker(): GuiTimePicker | null {
    return this.querySelector('gui-time-picker');
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  /**
   * Derives the internal selection with a strict precedence: a committed
   * `value` wins, else the host's working halves, else cleared. Running the
   * same rule on every external change (value or working props) keeps a
   * remounted popover consistent and prevents a stale day surviving an
   * external value clear.
   */
  override willUpdate(changedProperties: PropertyValues): void {
    const valueChanged = changedProperties.has('value');
    const workingChanged =
      changedProperties.has('workingDate') || changedProperties.has('workingTime');
    if (!valueChanged && !workingChanged) return;
    if (this._internalValueChange) {
      this._internalValueChange = false;
      return;
    }

    if (this.value) {
      const date = parseISODateTimeString(this.value);
      if (!isNaN(date.getTime())) {
        this._selectedDate = toISODateString(date);
        this._selectedTime = toISOTimeString(date);
        this.navigateToDate(date);
      }
      return;
    }

    const prev = changedProperties.get('value') as string | null | undefined;
    const clearedFromCommitted = valueChanged && !!prev;
    if (!clearedFromCommitted && !workingChanged) return;

    this._selectedDate = this.workingDate || undefined;
    this._selectedTime = this.workingTime || undefined;
    if (this._selectedDate) {
      const date = parseISODateString(this._selectedDate);
      if (!isNaN(date.getTime())) this.navigateToDate(date);
    }
  }

  private navigateToDate(date: Date): void {
    if (!isDateInVisibleMonths(date, this._nav.currentDate, this.numberOfMonths ?? 1)) {
      this._nav.currentDate = date;
    }
  }

  private setValueInternal(value: string | undefined) {
    this._internalValueChange = true;
    this.value = value;
  }

  private emitChange(value: string | null, commit = false) {
    this._surfacedError = false;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value, commit },
        bubbles: true,
        composed: true,
      }),
    );
  }

  selectDate(day: DateTimeCalendarDay) {
    if (!day.isCurrentMonth || day.isDisabled || this.disabled || this.readOnly) return;

    const isoDate = toISODateString(day.date);
    if (isoDate === this._selectedDate) return;

    this._selectedDate = isoDate;

    if (this._selectedTime) {
      const isoTime = this._selectedTime;
      this.setValueInternal(`${isoDate}T${isoTime}`);
      this.emitChange(this.value as string);
      const error = this.timeErrorForDay(isoTime, isoDate);
      if (error) this.emitInputError(error);
      return;
    }

    this.emitPartsChange();
  }

  private commitTime(isoTime: string, commit = false) {
    this._selectedTime = isoTime;
    this.setValueInternal(`${this._selectedDate}T${isoTime}`);
    this.emitChange(this.value as string, commit);
  }

  private stopInnerPartsChange = (event: Event) => {
    event.stopPropagation();
  };

  private onTimePickerChange(event: CustomEvent) {
    event.stopPropagation();

    const time = event.detail.value as string | null;
    const commit = event.detail.commit === true;
    if (!time) {
      this._selectedTime = undefined;
      if (this.value) {
        this.setValueInternal(undefined);
        this.emitChange(null);
      }
      this.emitPartsChange();
      return;
    }

    // No day chosen yet: park the time as working state and live-sync it —
    // the pick is kept, not lost, and commits once a day arrives.
    if (!this._selectedDate) {
      this._selectedTime = time;
      this.emitPartsChange();
      return;
    }

    this.commitTime(time, commit);
  }

  /** Live-syncs the working halves to a host picker (never wired by forms). */
  private emitPartsChange(): void {
    this.dispatchEvent(
      new CustomEvent('partsChange', {
        detail: { date: this._selectedDate ?? null, time: this._selectedTime ?? null },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Whether an inputError has been emitted and not yet cleared by a change. */
  private _surfacedError = false;

  private emitInputError(message: string): void {
    this._surfacedError = true;
    this.dispatchEvent(
      new CustomEvent('inputError', {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** The kept time checked against a day's bounds and disabled ranges. */
  private timeErrorForDay(isoTime: string, isoDate: string): string | null {
    const boundsError = timeBoundsError(isoTime, {
      minTime: this.minTime,
      maxTime: this.maxTime,
      minTimeMessage: this.minTimeMessage,
      maxTimeMessage: this.maxTimeMessage,
    });
    if (boundsError) return boundsError;

    const ranges = resolveDisabledTimeRangesForDate(this.disabledTimeRanges, isoDate);
    if (isTimeDisabled(isoTime, ranges)) {
      return this.disabledTimeRangeMessage ?? INVALID_DISABLED_TIME_RANGE_MESSAGE;
    }
    return null;
  }

  /**
   * With no committed value, ANY selection state left behind — a day without
   * a time, a time without a day, or a half-typed time — is incomplete: the
   * value flips to null (so validators report it) and the incomplete message
   * surfaces. A widget emptied again instead clears a message surfaced
   * earlier; a committed value reports nothing new.
   *
   * A half-typed time never reaches `_selectedTime` (partials never emit),
   * so the embedded input's parts are consulted directly — otherwise an
   * hour typed with no day picked would read as an empty widget.
   */
  private reportIncompleteOnLeave(): void {
    if (this.value) return;
    const leftBehind =
      !!this._selectedDate ||
      !!this._selectedTime ||
      this.querySelector<GuiTime>('gui-time')?.groupCompleteness() === 'partial';

    if (!leftBehind) {
      if (this._surfacedError) this.emitChange(null);
      return;
    }

    this.emitChange(null);
    this.emitInputError(this.incompleteMessage ?? INCOMPLETE_DATE_TIME_MESSAGE);
  }

  private onListToggle(event: CustomEvent<{ open: boolean }>) {
    event.stopPropagation();

    const { open } = event.detail;
    if (open && this.readOnly) {
      this.timePicker?.closeList();
      return;
    }

    this._timeGridOpen = open;
    if (open) this._nav.yearSelectorOpen = false;
  }

  /** Closes the embedded time picker before flipping the year grid. */
  private toggleYearSelector() {
    this.timePicker?.closeList();
    this._nav.toggleYearSelector();
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
      renderAboveCalendar: () => nothing,
      renderMonthPanel: (offset) =>
        renderCalendarMonthPanel({
          currentDate: this._nav.currentDate,
          offset,
          localeId: this.localeId,
          monthFormat: this.monthFormat,
          yearSelectorOpen: this._nav.yearSelectorOpen,
          selectYearAriaLabel: this.selectYearAriaLabel,
          onToggleYearSelector: () => this.toggleYearSelector(),
          renderBelowHeader: (o) => this.renderBelowHeader(o),
          renderPanelBody: (o) => this.renderPanelBody(o),
        }),
    });
  }

  /** The embedded time-picker row under the first panel's header. */
  private renderBelowHeader(offset: number): TemplateResult | typeof nothing {
    if (offset !== 0) return nothing;

    return html`
      <div class="gui-calendar__time-input-row">
        <gui-time-picker
          class="gui-time-picker gui-field"
          .uid=${this.uid ? `${this.uid}-time` : undefined}
          .showErrors=${false}
          .deferFocusLeave=${true}
          ?required=${this.required}
          ?disabled=${this.disabled}
          ?readonly=${this.readOnly}
          .allowCustomTime=${this.allowCustomTime}
          .value=${this._selectedTime}
          .localeId=${this.localeId}
          .hourFormat=${this.hourFormat}
          .minuteStep=${this.minuteStep}
          .minTime=${this.minTime}
          .maxTime=${this.maxTime}
          .disabledRanges=${this.resolvedTimeRanges}
          .columns=${4}
          .minTimeMessage=${this.minTimeMessage}
          .maxTimeMessage=${this.maxTimeMessage}
          .disabledRangeMessage=${this.disabledTimeRangeMessage}
          .noAvailableTimesMessage=${this.noAvailableTimesMessage}
          @change=${this.onTimePickerChange}
          @partsChange=${this.stopInnerPartsChange}
          @listtoggle=${this.onListToggle}
        ></gui-time-picker>
      </div>
    `;
  }

  private renderPanelBody(offset: number): TemplateResult {
    // The picker's contained list occupies the panel body space while open
    if (this._timeGridOpen && !this._nav.yearSelectorOpen && offset === 0) {
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

  renderDay(day: DateTimeCalendarDay) {
    const classes = {
      'gui-calendar__day-button': true,
      today: day.isToday,
      selected: day.isSelected,
      disabled: day.isDisabled,
      'other-month': !day.isCurrentMonth,
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
        @click=${() => this.selectDate(day)}
        @keydown=${(e: KeyboardEvent) => this._keyboard.handleDayKeydown(e)}
        aria-selected=${day.isSelected}
      >
        ${day.dayLabel}
      </button>
    `;
  }

  getDaysInMonth(offset: number): DateTimeCalendarDay[] {
    const selectedDate = this._selectedDate;

    return buildMonthDays<DateTimeCalendarDay>({
      currentDate: this._nav.currentDate,
      offset,
      localeId: this.localeId,
      numberOfMonths: this.numberOfMonths ?? 1,
      isDisabled: (date) => this.isDisabled(date),
      toDay: (base) => {
        const isSelected = computeDayStatus(base.date, { selectedISO: selectedDate }).isSelected;

        return {
          date: base.date,
          dayLabel: base.dayLabel,
          isCurrentMonth: base.isCurrentMonth,
          isToday: base.isToday,
          isDisabled: base.isDisabled,
          isSelected,
          isFocusable: (isSelected || base.isToday) && base.isCurrentMonth,
        };
      },
      focusFallbackDates: [selectedDate ? parseISODateString(selectedDate) : new Date()],
    });
  }

  private isDisabled(date: Date): boolean {
    return this._nav.isDisabled(date);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-date-time-calendar': GuiDateTimeCalendar;
  }
}

safeDefine('gui-date-time-calendar', GuiDateTimeCalendar);
