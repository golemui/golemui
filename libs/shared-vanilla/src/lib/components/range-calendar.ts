import { html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { DateRange, isSameDay, isToday, toISODateString } from '../utils/date';
import { AbstractCalendar, AbstractCalendarDay } from './abstract-calendar';

export interface RangeCalendarDay extends AbstractCalendarDay {
  isToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isOneDayRange: boolean;
  isAnchor: boolean;
  isSelecting: boolean;
}

@customElement('gui-range-calendar')
export class GuiRangeCalendarControl extends AbstractCalendar {
  @property({ type: Array }) value: DateRange[] | undefined = [];

  @state() private _anchorDate: Date | null = null;
  @state() private _nextDate: RangeCalendarDay | null = null;
  @state() private _isSelecting = false;

  override createRenderRoot() {
    return this;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      if (this.value && this.value.length > 0 && this.numberOfMonths === 1) {
        this._currentDate = new Date(this.value[0].start);
      }
    }
  }

  override renderDay(day: RangeCalendarDay): TemplateResult {
    const classes = {
      'gui-calendar__day-button': true,
      today: day.isToday,
      'other-month': !day.isCurrentMonth,
      'range-start': day.isRangeStart && !day.isOneDayRange,
      'range-end': day.isRangeEnd && !day.isOneDayRange,
      selected: day.isOneDayRange,
      'in-range': day.isInRange,
      'is-anchor': day.isAnchor,
      'is-selecting': day.isSelecting,
      disabled: day.isDisabled,
    };

    return html`
      <button
        type="button"
        class=${classMap(classes)}
        tabindex=${day.isFocusable ? 0 : -1}
        ?disabled=${!day.isCurrentMonth || day.isDisabled}
        data-date=${day.date.toISOString()}
        @click=${(e: MouseEvent) => this.selectDate(day, e)}
        @mouseover=${() => this.onMouseOver(day)}
        @focus=${() => this.onMouseOver(day)}
        @focusout=${this.onFocusOut}
        @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, day)}
        aria-selected=${day.isRangeStart || day.isRangeEnd ? 'true' : 'false'}
      >
        ${day.dayLabel}
      </button>
    `;
  }

  override getDaysInMonth(offset: number): RangeCalendarDay[] {
    // Normalize to the first day of the month so we calculate the months to render always from day 1
    const panelDate = new Date(this._currentDate);
    panelDate.setDate(1);
    panelDate.setMonth(panelDate.getMonth() + offset);

    const rawDates = this.generateDateGrid(offset);
    const targetMonth = panelDate.getMonth();

    let days = rawDates.map((date) => {
      const isCurrentMonth = date.getMonth() === targetMonth;
      const isDisabled = this.isDisabled(date);
      const isTodayDate = isToday(date);
      const { isRangeStart, isRangeEnd, isInRange, isSelecting } = this.checkDateStatus(date);
      const isFocusable = isTodayDate || isRangeStart;
      const isAnchor = this._anchorDate ? isSameDay(date, this._anchorDate) : false;

      return {
        date,
        dayLabel: new Intl.DateTimeFormat(this.localeId, { day: 'numeric' }).format(date),
        isCurrentMonth,
        isToday: isTodayDate,
        isRangeStart,
        isRangeEnd,
        isInRange,
        isDisabled,
        isOneDayRange: isRangeStart && isRangeEnd,
        isAnchor,
        isFocusable,
        isSelecting: isSelecting && isCurrentMonth,
      };
    });

    // We remove the 6th and 5th week if it only contains days of the next month
    for (let i = 0; i < 2; i++) {
      const lastWeek = days.slice(-7);
      if (lastWeek.every((day) => !day.isCurrentMonth)) {
        days = days.slice(0, -7);
      }
    }

    return days;
  }

  private checkDateStatus(date: Date) {
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;
    let isSelecting = false;

    if (this._isSelecting && this._nextDate && this._anchorDate) {
      const nextDate = this._nextDate.date;
      const anchor = new Date(this._anchorDate);
      if (nextDate.getTime() > anchor.getTime()) {
        isSelecting = date.getTime() >= anchor.getTime() && date.getTime() <= nextDate.getTime();
      } else {
        isSelecting = date.getTime() >= nextDate.getTime() && date.getTime() <= anchor.getTime();
      }
    }

    if (this.value && Array.isArray(this.value)) {
      for (const range of this.value) {
        const start = new Date(range.start);

        if (isSameDay(date, start)) {
          isRangeStart = true;
          isRangeEnd = !range.end;
        }

        if (range.end) {
          const end = new Date(range.end);

          if (isSameDay(date, end)) {
            isRangeEnd = true;
          }

          const dateTime = date.getTime();
          const startTime = start.getTime();
          const endTime = end.getTime();

          if (dateTime > startTime && dateTime < endTime) {
            isInRange = true;
          }
        }
      }
    }

    return { isRangeStart, isRangeEnd, isInRange, isSelecting };
  }

  override selectDate(day: RangeCalendarDay, e: MouseEvent | KeyboardEvent | null = null) {
    if (!day.isCurrentMonth || this.disabled || this.readOnly) return;

    const clickedDate = day.date;
    const isShiftPressed = e?.shiftKey;

    // Start selection
    if (!this._anchorDate) {
      this._isSelecting = true;
      this._anchorDate = clickedDate;

      // No shift pressed, clean selection and start a new one
      if (!isShiftPressed) {
        this.value = [];
        this.dispatchEvent(new CustomEvent('change', { detail: { value: [] } }));
      }
      return;
    }

    // End selection
    let startDate = this._anchorDate;
    let endDate = clickedDate;

    // Backward selection
    if (clickedDate < startDate) {
      startDate = clickedDate;
      endDate = this._anchorDate;
    }

    // Calculate ranges based on disabled days
    const newRanges = this.calculateValidRanges(startDate, endDate);
    const combinedRanges = [...(this.value || []), ...newRanges];
    this.value = this.mergeDateRanges(combinedRanges);

    this._isSelecting = false;
    this._nextDate = null;
    this._anchorDate = null;

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Merges overlapping or adjacent date ranges into a single range.
   *
   * @param {DateRange[]} ranges - An array of date range objects, where each object contains a start date and an optional end date. If no end date is specified, the start date is used as the range.
   * @return {DateRange[]} An array of merged date ranges, sorted by their start dates.
   */
  private mergeDateRanges(ranges: DateRange[]): DateRange[] {
    if (!ranges.length) return [];

    // Sort dates by "start"
    const sorted = ranges
      .map((r) => ({
        start: new Date(r.start).getTime(),
        end: new Date(r.end ?? r.start).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    const merged = sorted.reduce(
      (acc, next) => {
        const current = acc[acc.length - 1];

        // We ignore the first element
        if (current) {
          const currentEndDate = new Date(current.end);
          currentEndDate.setDate(currentEndDate.getDate() + 1);

          // Dates are overlapping, so we extend the "end"
          if (next.start <= currentEndDate.getTime()) {
            current.end = Math.max(current.end, next.end);
            return acc;
          }
        }

        return [...acc, next];
      },
      [] as { start: number; end: number }[],
    );

    // Return a DateRange[]
    return merged.map((m) => this.createRangeObject(new Date(m.start), new Date(m.end)));
  }

  /**
   * Calculates and returns an array of valid date ranges between the given start date and end date.
   * A date range is considered valid if no dates within the range are disabled.
   *
   * @param {Date} startDate - The starting date for the range calculation.
   * @param {Date} endDate - The ending date for the range calculation.
   * @return {DateRange[]} An array of valid date ranges where each range defines consecutive, non-disabled dates.
   */
  private calculateValidRanges(startDate: Date, endDate: Date): DateRange[] {
    const validRanges: DateRange[] = [];
    const iterator = new Date(startDate);
    const endLimit = new Date(endDate);

    iterator.setHours(0, 0, 0, 0);
    endLimit.setHours(0, 0, 0, 0);

    let currentRangeStart: Date | null = null;

    while (iterator <= endLimit) {
      const disabled = this.isDisabled(iterator);

      if (!disabled) {
        // It's a valid date, start range
        if (!currentRangeStart) {
          currentRangeStart = new Date(iterator);
        }
      } else {
        // It's a disabled date, and we have an open range, so we close it
        if (currentRangeStart) {
          const rangeEnd = new Date(iterator);
          rangeEnd.setDate(iterator.getDate() - 1);

          validRanges.push(this.createRangeObject(currentRangeStart, rangeEnd));
          currentRangeStart = null;
        }
      }

      // Move to next date
      iterator.setDate(iterator.getDate() + 1);
    }

    // Close range
    if (currentRangeStart) {
      validRanges.push(this.createRangeObject(currentRangeStart, endDate));
    }

    return validRanges;
  }

  /**
   * Creates a range object representing a single date or a date range.
   *
   * @param {Date} start - The start date of the range.
   * @param {Date} end - The end date of the range.
   * @return {DateRange} An object containing the start date and optionally the end date if it differs from the start date.
   */
  private createRangeObject(start: Date, end: Date): DateRange {
    const sStr = toISODateString(start);
    const eStr = toISODateString(end);

    // It's one date or a range of dates
    return sStr === eStr ? { start: sStr } : { start: sStr, end: eStr };
  }

  private onMouseOver(day: RangeCalendarDay) {
    if (this._isSelecting) {
      this._nextDate = day;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-calendar': GuiRangeCalendarControl;
  }
}
