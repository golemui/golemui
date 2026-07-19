import { html, LitElement, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateRange, DisabledTimeRange } from '@golemui/gui-shared/internals';
import './time-picker';
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
  isDateInVisibleMonths,
  isToday,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import { buildMonthDays, computeDayStatus } from '../utils/day-status';
import {
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

@customElement('gui-date-time-calendar')
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
      },
    }),
  });

  private _keyboard = new GUICalendarKeyboardController(this, {
    canGoPrev: () => this._nav.canGoPrev(),
    canGoNext: () => this._nav.canGoNext(),
    goPrev: () => this._nav.prevMonth(),
    goNext: () => this._nav.nextMonth(),
    // Enter/Space can only fire on a focused (hence enabled, in-month) day
    // button; the `disabled`/`readOnly` host guards stay inside `selectDate`.
    onActivateDay: (isoDate) => {
      const date = parseISODateString(isoDate);
      this.selectDate({
        date,
        dayLabel: getDayLabel(this.localeId, date),
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: false,
        isFocusable: true,
        isDisabled: false,
      });
    },
    onSelectYear: (year) => this._nav.selectYear(year),
    onCloseYearGrid: () => this._nav.closeYearSelector(),
    isYearGridOpen: () => this._nav.yearSelectorOpen,
  });

  private _focusLeave = new GUIFocusLeaveController(this, {
    onLeave: () => {
      this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
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

  override willUpdate(changedProperties: PropertyValues): void {
    if (!changedProperties.has('value')) return;
    if (this._internalValueChange) {
      this._internalValueChange = false;
      return;
    }

    if (this.value) {
      const date = parseISODateTimeString(this.value);
      if (!isNaN(date.getTime())) {
        this._selectedDate = toISODateString(date);
        this._selectedTime = toISOTimeString(date);
        if (!isDateInVisibleMonths(date, this._nav.currentDate, this.numberOfMonths ?? 1)) {
          this._nav.currentDate = date;
        }
      }
    } else if (this._selectedTime) {
      this._selectedDate = undefined;
      this._selectedTime = undefined;
    }
  }

  private setValueInternal(value: string | undefined) {
    this._internalValueChange = true;
    this.value = value;
  }

  private emitChange(value: string | null, commit = false) {
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
    this._selectedTime = undefined;

    if (this.value) {
      this.setValueInternal(undefined);
      this.emitChange(null);
    }
  }

  private commitTime(isoTime: string, commit = false) {
    if (!this._selectedDate) return;

    this._selectedTime = isoTime;
    this.setValueInternal(`${this._selectedDate}T${isoTime}`);
    this.emitChange(this.value as string, commit);
  }

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
      return;
    }

    this.commitTime(time, commit);
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
          ?required=${this.required}
          ?disabled=${this.disabled || !this._selectedDate}
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
        ?disabled=${!day.isCurrentMonth || day.isDisabled}
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

if (typeof customElements !== 'undefined' && !customElements.get('gui-date-time-calendar')) {
  customElements.define('gui-date-time-calendar', GuiDateTimeCalendar);
}
