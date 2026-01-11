import { html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { weekInfoData } from './week-info';
import { GUIAriaController } from '../controllers';
import { addErrors, addLabel, ControlTemplateData } from '../utils/templates';
import { CalendarProps } from '../field.props';

export interface CalendarDay {
  date: Date;
  dayLabel: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFocusable: boolean;
}

@customElement('gui-calendar')
export class GuiCalendarControl extends LitElement {
  @property({ type: String }) uid: string | undefined = undefined;
  @property({ type: String }) label: string | undefined = undefined;
  @property({ type: String }) hint: string | undefined = undefined;
  @property({ type: String, attribute: 'locale-id' }) localeId = 'en';
  @property({ type: Array }) errors: string[] | undefined = [];
  @property({ type: Boolean }) touched: boolean | undefined = undefined;
  @property({ type: Boolean }) required: boolean | undefined = false;
  @property({ type: Boolean }) disabled: boolean | undefined = false;
  @property({ type: Boolean, attribute: 'readonly' }) readOnly: boolean | undefined = false;
  @property({ type: String }) value: string | undefined = undefined;

  @property({ type: String, attribute: 'prev-month-icon' }) prevMonthIcon: string | undefined = '';
  @property({ type: String, attribute: 'next-month-icon' }) nextMonthIcon: string | undefined = '';
  @property() dayFormat: 'numeric' | '2-digit' | undefined = 'numeric';
  @property() weekdayFormat: 'short' | 'long' | 'narrow' | undefined = 'narrow';
  @property() monthFormat: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' | undefined = 'long';

  @state() private _currentDate: Date = new Date();

  private ariaController = new GUIAriaController(this, {
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

  override createRenderRoot() {
    return this;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('value')) {
      if (this.value) {
        this._currentDate = new Date(this.value);
      }
    }
  }

  override render() {
    const days: CalendarDay[] = this.getDaysInMonth();
    const weekDays: string[] = this.getWeekdayLabels();
    const templateData: ControlTemplateData<string> & CalendarProps = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readOnly,
      value: this.value,
      prevMonthIcon: this.prevMonthIcon,
      nextMonthIcon: this.nextMonthIcon,
      dayFormat: this.dayFormat,
      weekdayFormat: this.weekdayFormat,
      monthFormat: this.monthFormat,
    };

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, 'calendar') : nothing}

      <div class="gui-field">
        <div
          class="gui-calendar-input"
          aria-required=${templateData.required}
          aria-labelledby=${this.label ? `${templateData.uid}_calendar_label` : nothing}
        >
          <header class="gui-calendar__header">
            <button
              type="button"
              class="gui-button gui-calendar__month-button"
              @click=${this.prevMonth}
            >
              ${this.prevMonthIcon
                ? html`<span class="gui-calendar__month-button-icon ${this.prevMonthIcon}"></span>`
                : html`<span
                    class="gui-calendar__month-button-icon gui-calendar__month-button-icon--prev"
                  ></span>`}
            </button>

            <h2>${this.getMonthName()}</h2>

            <button
              type="button"
              class="gui-button gui-calendar__month-button"
              @click=${this.nextMonth}
            >
              ${this.nextMonthIcon
                ? html`<span class="gui-calendar__month-button-icon ${this.nextMonthIcon}"></span>`
                : html`<span
                    class="gui-calendar__month-button-icon gui-calendar__month-button-icon--next"
                  ></span>`}
            </button>
          </header>

          <div class="gui-calendar__days-grid">
            ${repeat(
              weekDays,
              (weekday: any) => weekday,
              (weekday: any) => html`<span class="gui-calendar__weekday">${weekday}</span>`,
            )}
            ${repeat(
              days,
              (day: any) => day.date.toISOString(),
              (day: any) => {
                {
                  const classes = {
                    'gui-calendar__day-button': true,
                    today: day.isToday,
                    selected: day.isSelected,
                    'other-month': !day.isCurrentMonth,
                  };

                  return html`
                    <button
                      type="button"
                      class=${classMap(classes)}
                      tabindex=${day.isFocusable ? 0 : -1}
                      ?disabled=${!day.isCurrentMonth}
                      data-date=${day.date.toISOString()}
                      @click=${() => this.selectDate(day)}
                      @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, day)}
                    >
                      ${day.dayLabel}
                    </button>
                  `;
                }
              },
            )}
          </div>
        </div>
      </div>

      ${this.errors?.length ? addErrors(this.uid as string, templateData) : nothing}
    `;
  }

  private getDaysInMonth(): CalendarDay[] {
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

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isSelected = this.isSelected(date);
      const isToday = this.isToday(date);
      const isFocusable = isSelected && isCurrentMonth;

      if (isFocusable) isDayFocusable = true;

      days.push({
        date: date,
        dayLabel: new Intl.DateTimeFormat(this.localeId, { day: 'numeric' }).format(date),
        isCurrentMonth,
        isToday,
        isSelected,
        isFocusable,
      });
    }

    if (!isDayFocusable) {
      const fallback =
        days.find((d) => d.isToday && d.isCurrentMonth) || days.find((d) => d.isCurrentMonth);
      if (fallback) {
        fallback.isFocusable = true;
      }
    }

    // We remove the 6th and 5th week if it only contains days of the next month
    for (let i = 0; i < 2; i++) {
      const lastWeek = days.slice(-7);
      if (lastWeek.every((day) => !day.isCurrentMonth)) {
        days = days.slice(0, -7);
      }
    }

    return days;
  }

  private get weekDaysOrder(): number[] {
    const localeData = weekInfoData[this.localeId] || { firstDay: 0 };
    return this.getOrderedWeekDays(localeData.firstDay);
  }

  private getOrderedWeekDays(firstDay: number): number[] {
    const base = [0, 1, 2, 3, 4, 5, 6];
    const start = firstDay % 7;
    return [...base.slice(start), ...base.slice(0, start)];
  }

  private getWeekdayLabels(): string[] {
    const formatter = new Intl.DateTimeFormat(this.localeId, { weekday: 'narrow' });
    // Anchor Sunday date
    const sundayRef = new Date(2025, 10, 30);
    return this.weekDaysOrder.map((dayCode) => {
      const d = new Date(sundayRef);
      d.setDate(sundayRef.getDate() + dayCode);
      return formatter.format(d);
    });
  }

  private getMonthName(): string {
    return new Intl.DateTimeFormat(this.localeId, { month: 'long' }).format(this._currentDate);
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
    if (!this.value) return false;
    const s = new Date(this.value);
    return (
      date.getDate() === s.getDate() &&
      date.getMonth() === s.getMonth() &&
      date.getFullYear() === s.getFullYear()
    );
  }

  private prevMonth() {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }

  private nextMonth() {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  private selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth) return;

    const isoDate = day.date.toISOString();
    this.value = isoDate;

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: isoDate },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async handleKeydown(event: KeyboardEvent, day: CalendarDay) {
    const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isNavKey && event.key !== ' ' && event.key !== 'Enter') return;

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
        this.selectDate(day);
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
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-calendar': GuiCalendarControl;
  }
}
