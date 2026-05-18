import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit-html/directives/repeat.js';
import {
  createDateRange,
  getDayLabel,
  isDateInVisibleMonths,
  isSameDay,
  isToday,
  mergeDateRanges,
} from '../utils/date';
import { createIntersectionObserver } from './tabs';
import { AbstractCalendar, type AbstractCalendarDay } from './abstract-calendar';
import { type DateRange } from '@golemui/gui-shared';

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
export class GuiRangeCalendar extends AbstractCalendar {
  @property({ type: Array }) value: DateRange[] | undefined = [];
  @property({ type: String }) focusDate: string | undefined = undefined;
  @property({ type: Boolean }) hidePills = false;
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;

  @state() private _anchorDate: Date | null = null;
  @state() private _nextDate: RangeCalendarDay | null = null;
  @state() private _isSelecting = false;
  @state() private _isStartVisible = true;
  @state() private _isEndVisible = true;

  private _skipValueNavigation = false;

  private startObserver: IntersectionObserver | undefined;
  private endObserver: IntersectionObserver | undefined;

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value') && !changedProperties.has('focusDate')) {
      if (this._skipValueNavigation) {
        this._skipValueNavigation = false;
      } else if (this.value) {
        const value = Array.isArray(this.value)
          ? this.value
          : [{ start: this.value as unknown as string }];

        if (value.length > 0 && value[0].start) {
          const date = new Date(value[0].start);
          if (
            !isNaN(date.getTime()) &&
            !isDateInVisibleMonths(date, this._currentDate, this.numberOfMonths ?? 1)
          ) {
            this._currentDate = date;
          }
        }
      }
    }
    if (changedProperties.has('focusDate')) {
      if (this.focusDate) {
        const date = new Date(this.focusDate);
        if (!isNaN(date.getTime())) {
          if (!isDateInVisibleMonths(date, this._currentDate, this.numberOfMonths ?? 1)) {
            this._currentDate = date;
          }
          // Reset so the same pill click triggers a change next time
          this.focusDate = undefined;
        }
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
        role="gridcell"
        class=${classMap(classes)}
        tabindex=${day.isFocusable ? 0 : -1}
        ?disabled=${!day.isCurrentMonth || day.isDisabled}
        data-date=${day.date.toISOString()}
        @click=${(e: MouseEvent) => this.selectDate(day, e)}
        @mouseover=${() => this.onMouseOver(day)}
        @focus=${() => this.onMouseOver(day)}
        @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, day)}
        aria-selected=${day.isRangeStart || day.isRangeEnd || day.isInRange ? 'true' : 'false'}
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
        dayLabel: getDayLabel(this.localeId, date),
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

    if (offset === 0 && !days.some((d) => d.isFocusable)) {
      const months = this.numberOfMonths ?? 1;
      const todayVisible = isDateInVisibleMonths(new Date(), this._currentDate, months);
      const rangeStartVisible =
        this.value?.some((range) =>
          isDateInVisibleMonths(new Date(range.start), this._currentDate, months),
        ) ?? false;

      if (!todayVisible && !rangeStartVisible) {
        const firstDay = days.find((d) => d.isCurrentMonth && !d.isDisabled);
        if (firstDay) firstDay.isFocusable = true;
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

  override selectDate(day: RangeCalendarDay, _e: MouseEvent | KeyboardEvent | null = null) {
    if (!day.isCurrentMonth || this.disabled || this.readOnly) return;

    const clickedDate = day.date;

    // Start selection
    if (!this._anchorDate) {
      this._isSelecting = true;
      this._anchorDate = clickedDate;
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
    this._skipValueNavigation = true;
    this.value = mergeDateRanges(combinedRanges);

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

          validRanges.push(createDateRange(currentRangeStart, rangeEnd));
          currentRangeStart = null;
        }
      }

      // Move to next date
      iterator.setDate(iterator.getDate() + 1);
    }

    // Close range
    if (currentRangeStart) {
      validRanges.push(createDateRange(currentRangeStart, endDate));
    }

    return validRanges;
  }

  private onMouseOver(day: RangeCalendarDay) {
    if (this._isSelecting) {
      this._nextDate = day;
    }
  }

  // --- Pills ---

  override updated() {
    if (!this.hidePills) {
      this.setupObservers();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnectObservers();
  }

  override renderAboveCalendar() {
    if (this.hidePills) return nothing;

    const pills = this.getSortedPills();
    if (pills.length === 0) return nothing;

    return html`
      <div
        class=${classMap({
          'gui-range-calendar__pills-wrapper': true,
          'gui-range-calendar--start-shadow': !this._isStartVisible,
          'gui-range-calendar--end-shadow': !this._isEndVisible,
        })}
      >
        <div class="gui-range-calendar__pills" role="list">
          <span class="gui-sentinel gui-sentinel__start"></span>
          ${repeat(
            pills,
            (pill) => `${pill.start}-${pill.end ?? pill.start}`,
            (pill, index) => this.renderPill(pill, index),
          )}
          <span class="gui-sentinel gui-sentinel__end"></span>
        </div>
      </div>
    `;
  }

  private renderPill(pill: DateRange, index: number) {
    const startFormatted = this.formatDateForDisplay(pill.start);
    const endFormatted = pill.end ? this.formatDateForDisplay(pill.end) : startFormatted;
    const pillLabel = `${startFormatted} - ${endFormatted}`;

    return html`
      <div
        class="gui-range-calendar__pill"
        role="listitem"
        tabindex="0"
        aria-label="${this.removePillAriaLabel ?? 'Remove date'} ${pillLabel}"
        @click=${() => this.navigateToDate(pill.start)}
        @keydown=${(e: KeyboardEvent) => this.handlePillKeydown(e, index)}
      >
        <span class="gui-range-calendar__pill-text">${pillLabel}</span>
        <button
          type="button"
          class="gui-range-calendar__pill-remove"
          tabindex="-1"
          ?disabled=${this.disabled || this.readOnly}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.removePill(index);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 256 256"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"
            ></path>
          </svg>
        </button>
      </div>
    `;
  }

  private formatDateForDisplay(isoDate: string): string {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat(this.localeId ?? 'en', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private getSortedPills(): DateRange[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return [...this.value].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }

  private removePill(index: number) {
    if (this.disabled || this.readOnly) return;

    const sorted = this.getSortedPills();
    sorted.splice(index, 1);
    this.value = [...sorted];

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handlePillKeydown(e: KeyboardEvent, index: number) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this.removePill(index);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const sorted = this.getSortedPills();
      if (sorted[index]) {
        this.navigateToDate(sorted[index].start);
      }
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const pills = this.querySelectorAll<HTMLElement>(
        '.gui-range-calendar__pills .gui-range-calendar__pill',
      );
      const newIndex = e.key === 'ArrowLeft' ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < pills.length) {
        pills[newIndex].focus();
      }
    }
  }

  private navigateToDate(isoDate: string) {
    const date = new Date(isoDate);
    if (
      !isNaN(date.getTime()) &&
      !isDateInVisibleMonths(date, this._currentDate, this.numberOfMonths ?? 1)
    ) {
      this._currentDate = date;
    }
  }

  private setupObservers() {
    const startSentinel = this.querySelector('.gui-sentinel__start');
    const endSentinel = this.querySelector('.gui-sentinel__end');

    if (startSentinel && !this.startObserver) {
      this.startObserver = createIntersectionObserver(
        startSentinel,
        (isIntersecting) => (this._isStartVisible = isIntersecting),
      );
    }

    if (endSentinel && !this.endObserver) {
      this.endObserver = createIntersectionObserver(
        endSentinel,
        (isIntersecting) => (this._isEndVisible = isIntersecting),
      );
    }

    if (!startSentinel && this.startObserver) {
      this.startObserver.disconnect();
      this.startObserver = undefined;
      this._isStartVisible = true;
    }
    if (!endSentinel && this.endObserver) {
      this.endObserver.disconnect();
      this.endObserver = undefined;
      this._isEndVisible = true;
    }
  }

  private disconnectObservers() {
    this.startObserver?.disconnect();
    this.endObserver?.disconnect();
    this.startObserver = undefined;
    this.endObserver = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-calendar': GuiRangeCalendar;
  }
}
