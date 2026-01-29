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
      if (this.value && this.value.length > 0) {
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

  override getDaysInMonth(): RangeCalendarDay[] {
    const rawDates = this.generateDateGrid();
    const month = this._currentDate.getMonth();

    let days = rawDates.map((date) => {
      const isCurrentMonth = date.getMonth() === month;
      const isDisabled = this.isDisabled(date);
      const isTodayDate = isToday(date);
      const { isRangeStart, isRangeEnd, isInRange, isSelecting } = this.checkDateStatus(date);
      const isFocusable = isRangeStart && isRangeEnd && isCurrentMonth;
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

  override selectDate(day: RangeCalendarDay, e: MouseEvent) {
    if (!day.isCurrentMonth || this.disabled || this.readOnly) return;

    const clickedDate = day.date;
    const isShiftPressed = e.shiftKey;

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

    const isSingleDay = isSameDay(startDate, endDate);
    const newRange: DateRange = {
      start: toISODateString(startDate),
      ...(isSingleDay ? {} : { end: toISODateString(endDate) }),
    };

    this.value = [...this.value!, newRange];

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
