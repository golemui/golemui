import { html, LitElement, nothing, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { repeat } from 'lit-html/directives/repeat.js';
import {
  DateRange,
  getMonthName,
  getWeekdayLabels,
  toISODateString,
  weekDaysOrder,
} from '../utils/date';
import { addErrors, addLabel } from '../utils/templates';

export interface AbstractCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isDisabled: boolean;
  isFocusable: boolean;
  dayLabel: string;
}

export abstract class AbstractCalendar extends LitElement {
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

  @state() _currentDate: Date = new Date();

  protected abstract getDaysInMonth(offset: number): AbstractCalendarDay[];
  protected abstract renderDay(day: AbstractCalendarDay): TemplateResult;
  protected abstract selectDate(day: AbstractCalendarDay, event?: MouseEvent | KeyboardEvent): void;

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

  override render() {
    const templateData: any = {
      uid: this.uid,
      label: this.label,
      hint: this.hint,
      errors: this.errors,
      touched: this.touched,
      required: this.required,
    };

    const monthsToRender = Array.from({ length: this.numberOfMonths ?? 1 }, (_, i) => i);

    return html`
      ${this.label ? addLabel(this.uid as string, templateData, false, 'calendar') : nothing}

      <div class="gui-widget">
        <div
          class="gui-calendar-input"
          aria-required=${this.required}
          aria-labelledby=${this.label ? `${this.uid}_calendar_label` : nothing}
        >
          <div class="gui-calendar__container">
            <button
              type="button"
              class="gui-button gui-calendar__month-button gui-calendar__month-button--prev"
              ?disabled=${!this.canGoPrev()}
              @click=${this.prevMonth}
            >
              ${this.prevMonthIcon ? html`<span class="${this.prevMonthIcon}"></span>` : '<'}
            </button>

            <div
              class="gui-calendar__months-grid"
              style="grid-template-columns: repeat(${Math.min(this.numberOfMonths ?? 1, 3)}, 1fr);"
            >
              ${monthsToRender.map((offset) => this.renderMonthPanel(offset))}
            </div>

            <button
              type="button"
              class="gui-button gui-calendar__month-button gui-calendar__month-button--next"
              ?disabled=${!this.canGoNext()}
              @click=${this.nextMonth}
            >
              ${this.nextMonthIcon ? html`<span class="${this.nextMonthIcon}"></span>` : '>'}
            </button>
          </div>
        </div>
      </div>

      ${this.errors?.length ? addErrors(this.uid as string, templateData) : nothing}
    `;
  }

  /**
   * Render a month panel
   */
  private renderMonthPanel(offset: number) {
    const days = this.getDaysInMonth(offset);
    const weekDays = getWeekdayLabels(this.localeId);
    const panelDate = new Date(this._currentDate);
    panelDate.setDate(1);
    panelDate.setMonth(panelDate.getMonth() + offset);

    return html`
      <div class="gui-calendar__panel">
        <header class="gui-calendar__header">
          <h2>${getMonthName(this.localeId, panelDate)}</h2>
        </header>

        <div class="gui-calendar__days-grid" role="grid">
          ${repeat(
            weekDays,
            (weekday, i) => i,
            (weekday) => html`<span class="gui-calendar__weekday">${weekday}</span>`,
          )}
          ${repeat(
            days,
            (day) => day.date.toISOString(),
            (day) => this.renderDay(day),
          )}
        </div>
      </div>
    `;
  }

  protected async handleKeydown(event: KeyboardEvent, day: AbstractCalendarDay) {
    const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isNavKey && event.key !== ' ' && event.key !== 'Enter') return;

    const buttons = Array.from(
      this.querySelectorAll<HTMLButtonElement>('.gui-calendar__day-button:not(.other-month)'),
    );
    const currentIndex = buttons.indexOf(event.target as HTMLButtonElement);

    let step = 0;
    switch (event.key) {
      case 'ArrowLeft':
        step = -1;
        break;
      case 'ArrowRight':
        step = 1;
        break;
      case 'ArrowUp':
        step = -7;
        break;
      case 'ArrowDown':
        step = 7;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.selectDate(day, event);
        return;
    }

    event.preventDefault();

    const nextIndex = this.findNextFocusableIndex(currentIndex, step, buttons);
    let monthChanged = false;

    if (nextIndex < 0) {
      if (this.canGoPrev()) {
        this.prevMonth();
        monthChanged = true;
      } else {
        // The previous month is beyond the minimum date, so we select the first available button
        const firstEnabledBtn = buttons.find((b) => !this.isButtonDisabled(b));
        firstEnabledBtn?.focus();
        return;
      }
    } else if (nextIndex >= buttons.length) {
      if (this.canGoNext()) {
        this.nextMonth();
        monthChanged = true;
      } else {
        // The next month is beyond the maximum date, so we select the first available button
        const reverseButtons = [...buttons].reverse();
        const lastEnabledBtn = reverseButtons.find((b) => !this.isButtonDisabled(b));
        lastEnabledBtn?.focus();
        return;
      }
    }

    if (monthChanged) {
      await this.updateComplete;

      const newButtons = Array.from(
        this.querySelectorAll<HTMLButtonElement>('.gui-calendar__day-button:not(.other-month)'),
      );

      const targetIndex =
        nextIndex < 0 ? newButtons.length + nextIndex : nextIndex - buttons.length;

      if (this.isButtonDisabled(newButtons[targetIndex])) {
        const correctedIndex = this.findNextFocusableIndex(targetIndex, step, newButtons);

        // Try to find the next day enabled in the new month
        if (correctedIndex < 0 || correctedIndex >= newButtons.length) {
          const firstEnabled = newButtons.findIndex((b) => !this.isButtonDisabled(b));
          if (firstEnabled > -1) newButtons[firstEnabled].focus();
        } else {
          newButtons[correctedIndex]?.focus();
        }
      } else {
        const safeIndex = Math.max(0, Math.min(targetIndex, newButtons.length - 1));
        newButtons[safeIndex]?.focus();
      }
    } else {
      buttons[nextIndex]?.focus();
    }
  }

  protected onFocusOut(e: FocusEvent) {
    if (e.relatedTarget && this.contains(e.relatedTarget as Node)) {
      return;
    }

    this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
  }

  protected isDisabled(date: Date): boolean {
    const isoDate = toISODateString(date);

    if (this.minDate && isoDate < this.minDate) return true;
    if (this.maxDate && isoDate > this.maxDate) return true;

    if (this.disabledRanges && this.disabledRanges.length > 0) {
      for (const range of this.disabledRanges) {
        const start = range.start.split('T')[0];
        const end = range.end ? range.end.split('T')[0] : start;

        if (isoDate >= start && isoDate <= end) {
          return true;
        }
      }
    }

    return false;
  }

  protected prevMonth() {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }

  protected nextMonth() {
    const d = this._currentDate;
    this._currentDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  protected generateDateGrid(offset = 0): Date[] {
    const year = this._currentDate.getFullYear();
    const month = this._currentDate.getMonth() + offset;

    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    const gridStartDay = weekDaysOrder(this.localeId)[0];
    const offsetDay = (dayOfWeek - gridStartDay + 7) % 7;
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - offsetDay);

    const dates: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  /**
   * Finds the next focusable button index based on the current index and step value.
   * This method skips disabled buttons and continues until it either finds
   * a focusable button or goes out of bounds of the given button list.
   *
   * @param {number} currentIndex - The index of the currently focused button.
   * @param {number} step - The step size to move. Can be positive or negative.
   * @param {HTMLButtonElement[]} buttons - The list of button elements to navigate through.
   * @return {number} - The index of the next focusable button if found; otherwise, returns out-of-bounds index.
   */
  protected findNextFocusableIndex(
    currentIndex: number,
    step: number,
    buttons: HTMLButtonElement[],
  ): number {
    let index = currentIndex + step;

    while (index >= 0 && index < buttons.length) {
      const button = buttons[index];
      if (!this.isButtonDisabled(button)) {
        return index;
      }
      index += step;
    }
    return index;
  }

  /**
   * Determines if a button element is disabled based on its attributes.
   *
   * @param {HTMLButtonElement | undefined} button - The button element to check. If undefined, the button is considered disabled.
   * @return {boolean} Returns true if the button is disabled or if no button element is provided, otherwise false.
   */
  protected isButtonDisabled(button: HTMLButtonElement | undefined): boolean {
    if (!button) return true;
    return button.hasAttribute('disabled');
  }

  /**
   * Determines whether navigation to the previous month is allowed.
   *
   * This method checks if the last day of the previous month exceeds the allowed minimum date.
   * If there is no minimum date defined, navigation is always allowed.
   *
   * @return {boolean} Returns true if navigation to the previous month is permitted; otherwise, returns false.
   */

  protected canGoPrev(): boolean {
    if (!this.minDate) return true;

    const prevMonthDate = new Date(
      this._currentDate.getFullYear(),
      this._currentDate.getMonth(),
      0,
    );
    const prevMonthStr = toISODateString(prevMonthDate);
    return prevMonthStr >= this.minDate;
  }

  /**
   * Determines whether navigation to the next month is allowed.
   *
   * This method checks if the first day of the next month exceeds the allowed maximum date.
   * If there is no maximum date defined, navigation is always allowed.
   *
   * @return {boolean} Returns true if navigation to the next month is permitted; otherwise, returns false.
   */

  protected canGoNext(): boolean {
    if (!this.maxDate) return true;

    const lastVisibleMonthOffset = (this.numberOfMonths ?? 1) - 1;
    const nextMonthDate = new Date(
      this._currentDate.getFullYear(),
      this._currentDate.getMonth() + lastVisibleMonthOffset + 1,
      1,
    );
    const nextMonthStr = toISODateString(nextMonthDate);

    return nextMonthStr <= this.maxDate;
  }
}
