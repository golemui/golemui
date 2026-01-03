import { weekInfoData } from './week-info';

export interface CalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocusable: boolean;
}

export class GuiCalendarPickerControl extends HTMLElement {
  private _abortController: AbortController | null = null;
  private _currentDate: Date = new Date();
  private _value: string | null = null;
  private _localeId = 'en';
  private _prevMonthIcon = '';
  private _nextMonthIcon = '';
  private _dayFormat = 'numeric';
  private _weekdayFormat = 'narrow';
  private _monthFormat = 'long';

  // INPUTS
  get value(): string | null {
    return this._value;
  }
  set value(val: string | null) {
    this._value = val;
    if (val) {
      this._currentDate = new Date(val);
    }
    this.render();
  }

  get localeId(): string {
    return this._localeId;
  }
  set localeId(localeId: string) {
    this._localeId = localeId;
    this.render();
  }

  get prevMonthIcon(): string {
    return this._prevMonthIcon;
  }
  set prevMonthIcon(icon: string) {
    this._prevMonthIcon = icon;
    this.render();
  }

  get nextMonthIcon(): string {
    return this._nextMonthIcon;
  }
  set nextMonthIcon(icon: string) {
    this._nextMonthIcon = icon;
    this.render();
  }

  get dayFormat(): string {
    return this._dayFormat;
  }
  set dayFormat(format: string) {
    this._dayFormat = format;
    this.render();
  }

  get weekdayFormat(): string {
    return this._weekdayFormat;
  }
  set weekdayFormat(format: string) {
    this._weekdayFormat = format;
    this.render();
  }

  get monthFormat(): string {
    return this._monthFormat;
  }
  set monthFormat(format: string) {
    this._monthFormat = format;
    this.render();
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    this.render();

    this.addEventListener('click', (e) => this.handleClick(e), { signal });
    this.addEventListener('keydown', (e) => this.handleKeydown(e), { signal });
  }

  render() {
    const days = this.daysInMonth;

    this.innerHTML = `
      <div class="gui-calendar__container">
        <header class="gui-calendar__header">
          <button type="button" data-action="prev" class="gui-button gui-calendar__month-button">
            ${this._prevMonthIcon ? `<span class="gui-calendar__month-button-icon ${this._prevMonthIcon}"></span>` : `<span class="gui-calendar__month-button-icon gui-calendar__month-button-icon--prev"></span>`}
          </button>
          <h2>${this.monthName}</h2>
          <button type="button" data-action="next" class="gui-button gui-calendar__month-button">
            ${this._nextMonthIcon ? `<span class="gui-calendar__month-button-icon ${this._nextMonthIcon}"></span>` : `<span class="gui-calendar__month-button-icon gui-calendar__month-button-icon--next"></span>`}
          </button>
        </header>

        <div class="gui-calendar__days-grid">
          ${this.weekdayLabels.map((day) => `<span class="gui-calendar__weekday">${day}</span>`).join('')}

          ${days
            .map(
              (day) => `
            <button
              type="button"
              class="gui-calendar__day-button ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''}"
              tabindex="${day.isFocusable ? 0 : -1}"
              ${!day.isCurrentMonth ? 'disabled' : ''}
              data-date="${day.date.toISOString()}"
            >
              ${day.dayLabel}
            </button>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
  }

  disconnectedCallback() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  private get weekDaysOrder(): number[] {
    const localeData = weekInfoData[this._localeId] || { firstDay: 0 };
    return this.getOrderedWeekDays(localeData.firstDay);
  }

  private get monthName(): string {
    return new Intl.DateTimeFormat(this._localeId, {
      month: 'long',
    }).format(this._currentDate);
  }

  private get daysInMonth(): CalendarDay[] {
    const year = this._currentDate.getFullYear();
    const month = this._currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const gridStartDay = this.weekDaysOrder[0];
    const offset = (dayOfWeek - gridStartDay + 7) % 7;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - offset);

    let isDayFocusable = false;
    let days: CalendarDay[] = [];

    // 6 weeks x 7 days = 42 days
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isSelected = this.isSelected(date);
      const isToday = this.isToday(date);
      const isFocusable = isSelected && isCurrentMonth;

      if (isFocusable) {
        isDayFocusable = true;
      }

      days.push({
        date: date,
        dayLabel: new Intl.DateTimeFormat(this._localeId, {
          day: 'numeric',
        }).format(date),
        isCurrentMonth: isCurrentMonth,
        isToday: isToday,
        isSelected: isSelected,
        isFocusable: isFocusable,
      });
    }

    // Fallback focus logic
    if (!isDayFocusable) {
      const today = days.find((day) => day.isToday && day.isCurrentMonth);
      if (today) {
        isDayFocusable = true;
        today.isFocusable = true;
      }
    }

    if (!isDayFocusable) {
      const firstCurrent = days.find((d) => d.isCurrentMonth);
      if (firstCurrent) firstCurrent.isFocusable = true;
    }

    // We remove the 6th week if it contains only days of the next month
    const lastWeek = days.slice(-7);
    if (lastWeek.every((day) => !day.isCurrentMonth)) {
      days = days.slice(0, -7);
    }

    return days;
  }

  private get weekdayLabels(): string[] {
    const formatter = new Intl.DateTimeFormat(this._localeId, {
      weekday: 'narrow',
    });
    // Get an anchor Sunday
    const sundayRef = new Date(2025, 10, 30);

    return this.weekDaysOrder.map((dayCode) => {
      const targetDate = new Date(sundayRef);
      targetDate.setDate(sundayRef.getDate() + dayCode);
      return formatter.format(targetDate);
    });
  }

  private getOrderedWeekDays(firstDayFromJSON: number): number[] {
    const startDayIndex = firstDayFromJSON % 7;
    const baseWeek = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun, 1=Mon, etc
    return [...baseWeek.slice(startDayIndex), ...baseWeek.slice(0, startDayIndex)];
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  private isSelected(date: Date): boolean {
    if (!this._value) return false;
    const selectedDate = new Date(this._value);
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  }

  private updateMonth(delta: number) {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
    this.render();
  }

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;

    const actionBtn = target.closest('[data-action]');
    if (actionBtn) {
      const action = (actionBtn as HTMLElement).dataset['action'];
      if (action === 'prev') this.updateMonth(-1);
      if (action === 'next') this.updateMonth(1);
      return;
    }

    const dayBtn = target.closest('.gui-calendar__day-button');
    if (dayBtn && !(dayBtn as HTMLButtonElement).disabled) {
      const dateStr = (dayBtn as HTMLElement).dataset['date'];
      if (dateStr) {
        this.selectDate(dateStr);
        this.focusDate(dateStr);
      }
    }
  }

  private handleKeydown(event: Event) {
    const e = event as KeyboardEvent;
    const target = e.target as HTMLElement;

    if (!target.classList.contains('gui-calendar__day-button')) return;

    const days = Array.from(this.querySelectorAll<HTMLElement>('.gui-calendar__day-button'));
    const currentIndex = days.indexOf(target);

    let nextIndex = currentIndex;
    let doFocus = false;

    switch (e.key) {
      case 'ArrowLeft':
        doFocus = true;
        nextIndex = currentIndex - 1;
        break;
      case 'ArrowRight':
        doFocus = true;
        nextIndex = currentIndex + 1;
        break;
      case 'ArrowUp':
        doFocus = true;
        nextIndex = currentIndex - 7;
        break;
      case 'ArrowDown':
        doFocus = true;
        nextIndex = currentIndex + 7;
        break;
    }

    if (doFocus) {
      e.preventDefault();
      if (nextIndex < 0) {
        this.updateMonth(-1);
        requestAnimationFrame(() => {
          const newDays = this.querySelectorAll<HTMLElement>('.gui-calendar__day-button');
          newDays[newDays.length + nextIndex]?.focus();
        });
      } else if (nextIndex >= days.length) {
        this.updateMonth(1);
        requestAnimationFrame(() => {
          const newDays = this.querySelectorAll<HTMLElement>('.gui-calendar__day-button');
          newDays[nextIndex - days.length]?.focus();
        });
      } else {
        days[nextIndex].focus();
      }
    }
  }

  private selectDate(isoDate: string) {
    this._value = isoDate;
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this._value } }));
    this.render();
  }

  private focusDate(isoDate: string) {
    requestAnimationFrame(() => {
      const btn = this.querySelector<HTMLElement>(`[data-date="${isoDate}"]`);
      btn?.focus();
    });
  }
}

customElements.define('gui-calendar-picker-control', GuiCalendarPickerControl);

declare global {
  interface HTMLElementTagNameMap {
    'gui-calendar-picker-control': GuiCalendarPickerControl;
  }
}
