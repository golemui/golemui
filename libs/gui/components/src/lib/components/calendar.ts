import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { classMap } from 'lit/directives/class-map.js';
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
  dateBoundsError,
  getDayLabel,
  getFullDateLabel,
  isToday,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import { buildMonthDays, computeDayStatus } from '../utils/day-status';
import type { DateRange } from '../types';
import { boundsValidity, GuiFormControl, type GuiValidity } from '../gui-form-control';
import { dispatchBlur, dispatchValue, valueEvents } from '../utils/events';

export interface CalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocusable: boolean;
  isDisabled: boolean;
}

/**
 * A month calendar to pick a date.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
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
export class GuiCalendar extends GuiFormControl {
  /**
   * Whether the element renders its hint. Elements that embed it turn it off and show the hint
   * themselves: `aria-describedby` still points at the hint by its id.
   */
  @property({ type: Boolean, attribute: 'show-hint' }) showHint: boolean | undefined = true;
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

  /** The selected date, as an ISO date (`YYYY-MM-DD`). */
  @property({ type: String }) value: string | undefined = undefined;

  /**
   * Month/year navigation state and guards, shared with the range calendar.
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
      dispatchBlur(this);
    },
  });

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      if (this.value) {
        this._nav.navigateToDate(parseISODateString(this.value));
      }
    }
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
      renderAboveCalendar: () => nothing,
      renderMonthPanel: (offset) =>
        renderCalendarMonthPanel({
          currentDate: this._nav.currentDate,
          offset,
          localeId: this.localeId,
          monthFormat: this.monthFormat,
          yearSelectorOpen: this._nav.yearSelectorOpen,
          selectYearAriaLabel: this.selectYearAriaLabel,
          disabled: this.disabled,
          onToggleYearSelector: () => this._nav.toggleYearSelector(),
          renderPanelBody: (o) => this.renderPanelBody(o),
        }),
    });
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

  /** @internal */
  renderDay(day: CalendarDay) {
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
        tabindex=${day.isFocusable && !this.disabled ? 0 : -1}
        ?disabled=${!day.isCurrentMonth || this.disabled}
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

  /** @internal */
  getDaysInMonth(offset: number): CalendarDay[] {
    const selectedDate = this.value;

    return buildMonthDays<CalendarDay>({
      currentDate: this._currentDate,
      offset,
      localeId: this.localeId,
      numberOfMonths: this.numberOfMonths ?? 1,
      isDisabled: (date) => this.isDisabled(date),
      toDay: (base) => {
        const isSelected = computeDayStatus(base.date, { selectedISO: selectedDate }).isSelected;

        return {
          date: base.date,
          dayLabel: getDayLabel(this.localeId, base.date, this.dayFormat),
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

  /** A day outside the bounds, such as a value set from code, then `required`. */
  protected override validate(): GuiValidity | null {
    const error = this.value
      ? dateBoundsError(this.value, this.minDate, this.maxDate, this.disabledRanges)
      : null;
    return boundsValidity(error, this.value, this.minDate, this.maxDate) ?? super.validate();
  }

  /** @internal */
  selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isDisabled || this.disabled || this.readOnly) return;

    const isoDate = toISODateString(day.date);

    this.value = isoDate;

    dispatchValue(this, isoDate);
  }

  protected isDisabled(date: Date): boolean {
    return this._nav.isDisabled(date);
  }
}

/** The events `gui-calendar` fires, with their types. */
export const GuiCalendarEvents = {
  ...valueEvents<GuiCalendar['value']>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-calendar': GuiCalendar;
  }
}

safeDefine('gui-calendar', GuiCalendar);
