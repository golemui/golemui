import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import type { DateTimeRange } from '@golemui/gui-shared/internals';
import {
  GuiRangeCalendar,
  DISABLED_DATE_RANGE_MESSAGE,
  type RangeCalendarDay,
} from './range-calendar';
import './time-picker';
import type { GuiTimePicker } from './time-picker';
import { isDateDisabled, isSameDay, parseISODateString, toISODateString } from '../utils/date';
import {
  dateTimeBoundsError,
  dateTimeRangeOverlaps,
  formatISODateTimeForLocale,
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

@customElement('gui-range-date-time-calendar')
export class GuiRangeDateTimeCalendar extends GuiRangeCalendar {
  @property({ type: Array }) override value: DateTimeRange[] | undefined = [];
  @property({ type: Array, attribute: 'disabled-ranges' }) override disabledRanges:
    | DateTimeRange[]
    | undefined = undefined;

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
  @property({ type: String, attribute: 'day-count-aria-label' }) dayCountAriaLabel:
    | string
    | undefined = undefined;

  @state() private _workingDateStart: string | undefined = undefined;
  @state() private _workingDateEnd: string | undefined = undefined;
  @state() private _workingTimeIn: string | undefined = undefined;
  @state() private _workingTimeOut: string | undefined = undefined;
  @state() private _openList: 'start' | 'end' | null = null;

  protected override parseEndpoint(iso: string): Date {
    return parseISODateTimeString(iso);
  }

  protected override endpointDay(iso: string): Date {
    return parseISODateString(iso.split('T')[0]);
  }

  protected override formatPillLabel(range: DateTimeRange): string {
    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const start = formatISODateTimeForLocale(range.start, this.localeId, hourFormat);
    const end = range.end
      ? formatISODateTimeForLocale(range.end, this.localeId, hourFormat)
      : start;
    return `${start} - ${end}`;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (
      !this.hasUpdated ||
      changedProperties.has('minDateTime') ||
      changedProperties.has('maxDateTime')
    ) {
      this.minDate = this.minDateTime ? this.minDateTime.split('T')[0] : undefined;
      this.maxDate = this.maxDateTime ? this.maxDateTime.split('T')[0] : undefined;
    }
    super.willUpdate(changedProperties);
  }

  /**
   * A day is unclickable only when a span covers it entirely.
   */
  protected override isDisabled(date: Date): boolean {
    const day = toISODateString(date);
    if (isDateDisabled(day, this.minDate, this.maxDate)) return true;
    return isDayFullyBlocked(day, this.disabledRanges);
  }

  override selectDate(day: RangeCalendarDay, _e: MouseEvent | KeyboardEvent | null = null) {
    if (!day.isCurrentMonth || this.disabled || this.readOnly) return;

    const clickedDate = day.date;

    // Start selection
    if (!this._anchorDate) {
      this.resetWorking();
      this._invalidRange = null;
      this._isSelecting = true;
      this._anchorDate = clickedDate;
      return;
    }

    // End selection — order the days (start <= end)
    let startDate = this._anchorDate;
    let endDate = clickedDate;
    if (clickedDate < startDate) {
      startDate = clickedDate;
      endDate = this._anchorDate;
    }

    this._isSelecting = false;
    this._nextDate = null;
    this._anchorDate = null;

    if (this.spanCoversBlockedDay(startDate, endDate)) {
      this._invalidRange = { start: startDate, end: endDate };
      this.emitInputError(this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE);
      this.requestUpdate();
      return;
    }

    this._invalidRange = null;
    this._workingDateStart = toISODateString(startDate);
    this._workingDateEnd = toISODateString(endDate);
    this._workingTimeIn = undefined;
    this._workingTimeOut = undefined;
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

  /** Highlights the parked working date range like a committed one. */
  protected override checkDateStatus(date: Date) {
    const status = super.checkDateStatus(date);
    if (this._workingDateStart && this._workingDateEnd) {
      const start = parseISODateString(this._workingDateStart);
      const end = parseISODateString(this._workingDateEnd);
      const time = date.getTime();
      if (isSameDay(date, start)) status.isRangeStart = true;
      if (isSameDay(date, end)) status.isRangeEnd = true;
      if (time > start.getTime() && time < end.getTime()) status.isInRange = true;
    }
    return status;
  }

  private onStartTimeChange(event: CustomEvent) {
    event.stopPropagation();
    // Only a deliberate selection (list pick or Enter) advances the flow
    if (event.detail.commit !== true) return;

    const time = event.detail.value as string | null;
    if (!time || !this._workingDateStart) {
      this._workingTimeIn = undefined;
      this._workingTimeOut = undefined;
      return;
    }
    const error = this.timeError(time, this._workingDateStart, this.resolvedStartTimeRanges);
    if (error) {
      // Keep the end picker disabled until the start is valid.
      this._workingTimeIn = undefined;
      this._workingTimeOut = undefined;
      this.emitInputError(error);
      return;
    }
    this._workingTimeIn = time;
    this._workingTimeOut = undefined;
  }

  private onEndTimeChange(event: CustomEvent) {
    event.stopPropagation();
    // Only a deliberate selection creates the pill; typing a custom time must
    // not, or it would commit an unintended pill.
    if (event.detail.commit !== true) return;

    const time = event.detail.value as string | null;
    if (!time) {
      this._workingTimeOut = undefined;
      return;
    }
    if (!this._workingTimeIn || !this._workingDateStart || !this._workingDateEnd) return;

    const endError = this.timeError(time, this._workingDateEnd, this.resolvedEndTimeRanges);
    if (endError) {
      this._workingTimeOut = time;
      this.emitInputError(endError);
      return;
    }

    const ordered = orderDateTimeRange(
      `${this._workingDateStart}T${this._workingTimeIn}`,
      `${this._workingDateEnd}T${time}`,
    );

    if (dateTimeRangeOverlaps(ordered, this.disabledRanges)) {
      this._workingTimeOut = time;
      this.emitInputError(this.disabledRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE);
      return;
    }

    this._skipValueNavigation = true;
    this.value = mergeDateTimeRanges([...(this.value ?? []), ordered]);
    this.resetWorking();
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value }, bubbles: true, composed: true }),
    );
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
    this._workingDateStart = undefined;
    this._workingDateEnd = undefined;
    this._workingTimeIn = undefined;
    this._workingTimeOut = undefined;
    this._openList = null;
    this.resetPicker(this.startPicker);
    this.resetPicker(this.endPicker);
  }

  private resetPicker(picker: GuiTimePicker | null) {
    if (!picker) return;
    picker.value = undefined;
    picker.closeList();
  }

  private emitInputError(message: string) {
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

  protected override toggleYearSelector() {
    this.startPicker?.closeList();
    this.endPicker?.closeList();
    super.toggleYearSelector();
  }

  private get resolvedStartTimeRanges() {
    return this._workingDateStart
      ? resolveDisabledTimesForDate(this.disabledRanges, this._workingDateStart)
      : [];
  }

  private get resolvedEndTimeRanges() {
    return this._workingDateEnd
      ? resolveDisabledTimesForDate(this.disabledRanges, this._workingDateEnd)
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
    return this._workingDateStart ? this.dayClampedBounds(this._workingDateStart) : {};
  }

  private get endListBounds(): { minTime?: string; maxTime?: string } {
    if (!this._workingDateEnd) return {};
    const base = this.dayClampedBounds(this._workingDateEnd);
    if (this._workingDateEnd !== this._workingDateStart || !this._workingTimeIn) return base;
    const floor = oneStepAfterISOTime(this._workingTimeIn, this.minuteStep);
    if (!floor) return { minTime: '23:59:59', maxTime: '00:00:00' };
    return { minTime: floor, maxTime: base.maxTime };
  }

  protected override renderBelowHeader(offset: number): TemplateResult | typeof nothing {
    if (offset !== 0) return nothing;

    const startEnabled = !this.disabled && !!this._workingDateStart;
    const endEnabled = !this.disabled && !!this._workingTimeIn;
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
            ?required=${this.required}
            ?disabled=${!startEnabled}
            ?readonly=${this.readOnly}
            .allowCustomTime=${this.allowCustomTime}
            .value=${this._workingTimeIn}
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
            ?required=${this.required}
            ?disabled=${!endEnabled}
            ?readonly=${this.readOnly}
            .allowCustomTime=${this.allowCustomTime}
            .value=${this._workingTimeOut}
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
            @listtoggle=${(e: CustomEvent<{ open: boolean }>) => this.onListToggle(e, 'end')}
          ></gui-time-picker>
        </div>
      </div>
    `;
  }

  protected override renderPanelBody(offset: number): TemplateResult {
    // An open time list takes over the panel body (the day grid) like the
    // single date-time calendar does.
    if (this._openList && !this._yearSelectorOpen && offset === 0) {
      return html``;
    }
    return super.renderPanelBody(offset);
  }

  protected override renderDayContent(day: RangeCalendarDay): TemplateResult {
    const count = day.isCurrentMonth ? this.countRangesOnDay(day.date) : 0;
    if (count <= 1) return html`${day.dayLabel}`;

    const label = (this.dayCountAriaLabel ?? '{count} ranges').replace('{count}', String(count));
    return html`${day.dayLabel}<span
        class="gui-range-date-time-calendar__day-count"
        aria-label=${label}
        >${count}</span
      >`;
  }

  /** Committed ranges covering `date`, a range counts on every day of its span. */
  private countRangesOnDay(date: Date): number {
    if (!this.value?.length) return 0;
    const iso = toISODateString(date);
    return this.value.filter((range) => {
      const start = range.start.split('T')[0];
      const end = (range.end ?? range.start).split('T')[0];
      return iso >= start && iso <= end;
    }).length;
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
