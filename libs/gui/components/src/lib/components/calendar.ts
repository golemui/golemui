import { html, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  getDayLabel,
  isDateInVisibleMonths,
  isSameDay,
  isToday,
  toISODateString,
} from '../utils/date';
import { AbstractCalendar } from './abstract-calendar';

export interface CalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocusable: boolean;
  isDisabled: boolean;
}

@customElement('gui-calendar')
export class GuiCalendar extends AbstractCalendar {
  @property({ type: String }) value: string | undefined = undefined;

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
        const date = new Date(this.value);
        if (
          !isNaN(date.getTime()) &&
          !isDateInVisibleMonths(date, this._currentDate, this.numberOfMonths ?? 1)
        ) {
          this._currentDate = date;
        }
      }
    }
  }

  override renderDay(day: CalendarDay) {
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
        data-date=${day.date.toISOString()}
        @click=${() => this.selectDate(day)}
        @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, day)}
        aria-selected=${day.isSelected}
      >
        ${day.dayLabel}
      </button>
    `;
  }

  override getDaysInMonth(offset: number): CalendarDay[] {
    // Normalize to the first day of the month so we calculate the months to render always from day 1
    const panelDate = new Date(this._currentDate);
    panelDate.setDate(1);
    panelDate.setMonth(panelDate.getMonth() + offset);

    const rawDates = this.generateDateGrid(offset);
    const targetMonth = panelDate.getMonth();

    let days = rawDates.map((date) => {
      const isCurrentMonth = date.getMonth() === targetMonth;
      const isDisabled = this.isDisabled(date);
      const isSelected = !!this.value && isSameDay(date, new Date(this.value));
      const isTodayDate = isToday(date);
      const isFocusable = (isSelected || isTodayDate) && isCurrentMonth;

      return {
        date,
        dayLabel: getDayLabel(this.localeId, date),
        isCurrentMonth,
        isToday: isTodayDate,
        isDisabled,
        isSelected,
        isFocusable,
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
      const referenceDate = this.value ? new Date(this.value) : new Date();
      if (!isDateInVisibleMonths(referenceDate, this._currentDate, this.numberOfMonths ?? 1)) {
        const firstDay = days.find((d) => d.isCurrentMonth && !d.isDisabled);
        if (firstDay) firstDay.isFocusable = true;
      }
    }

    return days;
  }

  override selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isDisabled || this.disabled || this.readOnly) return;

    const isoDate = toISODateString(day.date);

    this.value = isoDate;

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: isoDate },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-calendar': GuiCalendar;
  }
}
