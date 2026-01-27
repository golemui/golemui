import { html, LitElement, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { weekInfoData } from './week-info';
import { GUIAriaController } from '../controllers';
import { addErrors, addLabel } from '../utils/templates';

export interface DateRange {
  start: string;
  end?: string;
}

export interface RangeCalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isOneDayRange: boolean;
  isAnchor: boolean;
  isFocusable: boolean;
  isSelecting: boolean;
}

@customElement('gui-range-calendar')
export class GuiRangeCalendarControl extends LitElement {
  @property({ type: String }) uid: string = crypto.randomUUID();
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId: string | undefined = undefined;
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;

  @property({ type: Array }) value: DateRange[] | undefined = [];

  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  @property() dayFormat: 'numeric' | '2-digit' | undefined = 'numeric';
  @property() weekdayFormat: 'short' | 'long' | 'narrow' | undefined = 'narrow';
  @property() monthFormat: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' | undefined = 'long';

  @state() private _currentDate: Date = new Date();
  @state() private _anchorDate: Date | null = null;
  @state() private _nextDate: RangeCalendarDay | null = null;
  @state() private _isSelecting = false;

  private ariaController = new GUIAriaController(this, {
    getTargets: () => this.querySelectorAll(`.gui-calendar-input`),
    getState: () => ({
      uid: this.uid,
      templateData: {
        hint: this.hint,
        errors: this.errors,
        readonly: this.readOnly,
        disabled: this.disabled,
        touched: this.touched,
      },
    }),
  });

  override createRenderRoot() {
    return this;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      if (this.value && this.value.length > 0) {
        // this._currentDate = new Date(this.value[0].start);
      }
    }
  }

  override render() {
    const days: RangeCalendarDay[] = this.getDaysInMonth();
    const weekDays: string[] = this.getWeekdayLabels();

    const templateData: any = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
    };

    return html`
      ${this.label ? addLabel(this.uid, templateData, false, 'calendar') : nothing}

      <div class="gui-field">
        <div
          class="gui-calendar-input"
          aria-required=${this.required}
          aria-labelledby=${this.label ? `${this.uid}_calendar_label` : nothing}
        >
          <header class="gui-calendar__header">
            <button
              type="button"
              class="gui-button gui-calendar__month-button"
              @click=${this.prevMonth}
            >
              ${this.prevMonthIcon ? html`<span class="${this.prevMonthIcon}"></span>` : '<'}
            </button>

            <h2>${this.getMonthName()}</h2>

            <button
              type="button"
              class="gui-button gui-calendar__month-button"
              @click=${this.nextMonth}
            >
              ${this.nextMonthIcon ? html`<span class="${this.nextMonthIcon}"></span>` : '>'}
            </button>
          </header>

          <div class="gui-calendar__days-grid" role="grid">
            ${repeat(
              weekDays,
              (weekday, i) => i,
              (weekday) =>
                html`<span class="gui-calendar__weekday" style="text-align:center"
                  >${weekday}</span
                >`,
            )}
            ${repeat(
              days,
              (day) => day.date.toISOString(),
              (day) => this.renderRangeDay(day),
            )}
          </div>
        </div>
      </div>

      ${this.errors?.length ? addErrors(this.uid, templateData) : nothing}
    `;
  }

  private renderRangeDay(day: RangeCalendarDay): TemplateResult {
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
    };

    return html`
      <button
        type="button"
        class=${classMap(classes)}
        tabindex=${day.isFocusable ? 0 : -1}
        ?disabled=${!day.isCurrentMonth || this.disabled}
        data-date=${day.date.toISOString()}
        @click=${(e: MouseEvent) => this.handleDateClick(e, day)}
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

  private getDaysInMonth(): RangeCalendarDay[] {
    const year = this._currentDate.getFullYear();
    const month = this._currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const gridStartDay = this.weekDaysOrder[0];
    const offset = (dayOfWeek - gridStartDay + 7) % 7;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - offset);

    const days: RangeCalendarDay[] = [];
    let hasFocusable = false;

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = this.isToday(date);
      const { isRangeStart, isRangeEnd, isInRange, isSelecting } = this.checkDateStatus(date);

      const isAnchor = this._anchorDate ? this.isSameDay(date, this._anchorDate) : false;

      const isFocusable =
        (isRangeStart || isAnchor || (isToday && !this.value?.length)) && isCurrentMonth;
      if (isFocusable) hasFocusable = true;

      days.push({
        date,
        dayLabel: new Intl.DateTimeFormat(this.localeId, { day: 'numeric' }).format(date),
        isCurrentMonth,
        isToday,
        isRangeStart,
        isRangeEnd,
        isInRange,
        isOneDayRange: isRangeStart && isRangeEnd,
        isAnchor,
        isFocusable,
        isSelecting: isSelecting && isCurrentMonth,
      });
    }

    if (!hasFocusable) {
      const fallback = days.find((d) => d.isCurrentMonth);
      if (fallback) fallback.isFocusable = true;
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

        if (this.isSameDay(date, start)) {
          isRangeStart = true;
          isRangeEnd = !range.end;
        }

        if (range.end) {
          const end = new Date(range.end);

          if (this.isSameDay(date, end)) {
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

  private handleDateClick(e: MouseEvent, day: RangeCalendarDay) {
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

    const isSingleDay = this.isSameDay(startDate, endDate);
    const newRange: DateRange = {
      start: startDate.toISOString(),
      ...(isSingleDay ? {} : { end: endDate.toISOString() }),
    };

    this.value = [...this.value!, newRange];

    this._isSelecting = false;
    this._nextDate = null;
    this._anchorDate = null;
    this.emitChange();
  }

  private async handleKeydown(event: KeyboardEvent, day: RangeCalendarDay) {
    const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(
      event.key,
    );
    if (!isNavKey) return;

    const buttons = Array.from(
      this.querySelectorAll<HTMLButtonElement>('.gui-calendar__day-button:not([disabled])'),
    );
    const currentIndex = buttons.indexOf(event.target as HTMLButtonElement);

    let nextIndex = currentIndex;
    let monthChanged = false;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex + 1;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex - 7;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex + 7;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.handleDateClick({ shiftKey: event.shiftKey } as MouseEvent, day);
        return;
    }

    event.preventDefault();

    if (nextIndex < 0) {
      this.prevMonth();
      monthChanged = true;
    } else if (nextIndex >= buttons.length) {
      this.nextMonth();
      monthChanged = true;
    }

    if (monthChanged) {
      await this.updateComplete;

      const newButtons = Array.from(
        this.querySelectorAll<HTMLButtonElement>('.gui-calendar__day-button:not([disabled])'),
      );

      if (nextIndex < 0) {
        const target = Math.max(0, newButtons.length + nextIndex);
        newButtons[target]?.focus();
      } else {
        const target = Math.max(0, nextIndex - buttons.length);
        newButtons[target]?.focus();
      }
    } else {
      buttons[nextIndex]?.focus();
    }
  }

  private emitChange() {
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  private prevMonth() {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }

  private nextMonth() {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  private getMonthName(): string {
    return new Intl.DateTimeFormat(this.localeId, { month: 'long' }).format(this._currentDate);
  }

  private get weekDaysOrder(): number[] {
    const localeData = weekInfoData[this.localeId ?? 'en'] || { firstDay: 0 };
    return this.getOrderedWeekDays(localeData.firstDay);
  }

  private getOrderedWeekDays(firstDay: number): number[] {
    const base = [0, 1, 2, 3, 4, 5, 6];
    const start = firstDay % 7;
    return [...base.slice(start), ...base.slice(0, start)];
  }

  private getWeekdayLabels(): string[] {
    const formatter = new Intl.DateTimeFormat(this.localeId, { weekday: 'narrow' });
    const sundayRef = new Date(2025, 10, 30); // Un domingo conocido
    return this.weekDaysOrder.map((dayCode) => {
      const d = new Date(sundayRef);
      d.setDate(sundayRef.getDate() + dayCode);
      return formatter.format(d);
    });
  }

  private onMouseOver(day: RangeCalendarDay) {
    if (this._isSelecting) {
      this._nextDate = day;
    }
  }

  private onFocusOut(e: FocusEvent) {
    if (e.relatedTarget && this.contains(e.relatedTarget as Node)) return;
    this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-calendar': GuiRangeCalendarControl;
  }
}
