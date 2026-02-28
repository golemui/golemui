import { html, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { getDayLabel, isSameDay, isToday, toISODateString } from '../utils/date';
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

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      if (this.value && this.numberOfMonths === 1) {
        this._currentDate = new Date(this.value);
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
        @focusout=${this.onFocusOut}
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
      const isFocusable = isSelected && isCurrentMonth;

      return {
        date,
        dayLabel: getDayLabel(this.localeId, date),
        isCurrentMonth,
        isToday: isToday(date),
        isDisabled,
        isSelected,
        isFocusable: isFocusable || (!this.value && isToday(date) && isCurrentMonth),
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

  override selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth || day.isDisabled) return;

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
