import { html, LitElement, nothing, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GUIAriaController } from '../controllers/aria.controller';
import { repeat } from 'lit-html/directives/repeat.js';
import {
  getMonthYearParts,
  getWeekdayLabels,
  toISODateString,
  weekDaysOrder,
} from '../utils/date';
import { addErrors, addLabel } from '../utils/templates';
import { DateRange } from '@golemui/gui-shared';

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
  @property({ type: String, attribute: 'prev-month-aria-label' }) prevMonthAriaLabel:
    | string
    | undefined = '';
  @property({ type: String, attribute: 'next-month-aria-label' }) nextMonthAriaLabel:
    | string
    | undefined = '';
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
  @state() private _yearSelectorOpen = false;

  private _blurRafId: number | undefined;

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
          role="group"
          aria-labelledby=${this.label ? `${this.uid}_calendar_label` : nothing}
        >
          <div class="gui-calendar__container">
            <button
              type="button"
              class="gui-button gui-calendar__month-button gui-calendar__month-button--prev"
              ?disabled=${!this.canGoPrev()}
              @click=${this.prevMonth}
              aria-label=${this.prevMonthAriaLabel ?? 'Previous month'}
            >
              ${this.prevMonthIcon ? html`<span class="${this.prevMonthIcon}"></span>` : '<'}
            </button>

            <div class="gui-calendar__months-grid">
              ${monthsToRender.map((offset) => this.renderMonthPanel(offset))}
            </div>

            <button
              type="button"
              class="gui-button gui-calendar__month-button gui-calendar__month-button--next"
              ?disabled=${!this.canGoNext()}
              @click=${this.nextMonth}
              aria-label=${this.nextMonthAriaLabel ?? 'Next month'}
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
    const weeks = this.chunkDays(days);
    const weekDays = getWeekdayLabels(this.localeId);
    const panelDate = new Date(this._currentDate);
    panelDate.setDate(1);
    panelDate.setMonth(panelDate.getMonth() + offset);

    return html`
      <div class="gui-calendar__panel">
        ${this.renderHeader(panelDate)}

        ${this._yearSelectorOpen && offset === 0
          ? this.renderYearGrid()
          : html`
              <div class="gui-calendar__days-grid" role="grid">
                <div role="row" class="gui-calendar__rows">
                  ${repeat(
                    weekDays,
                    (weekday, i) => i,
                    (weekday) =>
                      html`<span class="gui-calendar__weekday" role="gridcell">${weekday}</span>`,
                  )}
                </div>

                ${repeat(
                  weeks,
                  (week) => html`
                    <div role="row" class="gui-calendar__rows">
                      ${repeat(
                        week,
                        (day) => day.date.toISOString(),
                        (day) => this.renderDay(day),
                      )}
                    </div>
                  `,
                )}
              </div>
            `}
      </div>
    `;
  }

  private renderHeader(panelDate: Date) {
    const parts = getMonthYearParts(this.localeId, panelDate, this.monthFormat);

    return html`
      <header class="gui-calendar__header">
        <h2>
          ${parts.map((part) =>
            part.type === 'year'
              ? html`<button
                  type="button"
                  class="gui-calendar__year-selector"
                  @click=${this.toggleYearSelector}
                  aria-expanded=${this._yearSelectorOpen}
                  aria-label="Select year"
                >
                  <span class="gui-calendar__year-value">${part.value}</span>
                  <span class="gui-calendar__year-arrows" aria-hidden="true">
                    <span>&#9650;</span><span>&#9660;</span>
                  </span>
                </button>`
              : html`<span class="gui-calendar__month-name">${part.value}</span>`,
          )}
        </h2>
      </header>
    `;
  }

  private renderYearGrid() {
    const currentYear = this._currentDate.getFullYear();
    const years = this._yearList;

    return html`
      <div
        class="gui-calendar__year-grid"
        role="grid"
        aria-label="Year selection"
        @keydown=${this.handleYearKeydown}
      >
        ${this.chunkYears(years).map(
          (row) => html`
            <div role="row" class="gui-calendar__year-row">
              ${row.map(
                (year) => html`
                  <button
                    type="button"
                    role="gridcell"
                    class="gui-calendar__year-button ${year === currentYear ? 'current' : ''}"
                    tabindex=${year === currentYear ? 0 : -1}
                    data-year=${year}
                    @click=${(e: MouseEvent) => { e.stopPropagation(); this.selectYear(year); }}
                    @focusout=${this.onFocusOut}
                    aria-selected=${year === currentYear}
                  >
                    ${year}
                  </button>
                `,
              )}
            </div>
          `,
        )}
      </div>
    `;
  }

  private chunkYears(years: number[]): number[][] {
    const chunks: number[][] = [];
    for (let i = 0; i < years.length; i += 4) {
      chunks.push(years.slice(i, i + 4));
    }
    return chunks;
  }

  private toggleYearSelector() {
    this._yearSelectorOpen = !this._yearSelectorOpen;
    if (this._yearSelectorOpen) {
      this.updateComplete.then(() => {
        this.scrollToCurrentYear();
        this.focusCurrentYearButton();
      });
    }
  }

  private selectYear(year: number) {
    // Move focus to the year selector button BEFORE removing the year grid,
    // so focusout fires with relatedTarget inside the component and date pickers don't close.
    const yearSelectorBtn = this.querySelector('.gui-calendar__year-selector') as HTMLButtonElement;
    yearSelectorBtn?.focus();

    const d = this._currentDate;
    this._currentDate = new Date(year, d.getMonth(), 1);
    this._yearSelectorOpen = false;
    this.updateComplete.then(() => {
      const focusableDay = this.querySelector<HTMLButtonElement>(
        '.gui-calendar__day-button[tabindex="0"]',
      );
      focusableDay?.focus();
    });
  }

  private scrollToCurrentYear() {
    const yearGrid = this.querySelector('.gui-calendar__year-grid');
    const currentBtn = this.querySelector('.gui-calendar__year-button.current') as HTMLElement;
    if (yearGrid && currentBtn) {
      const gridRect = yearGrid.getBoundingClientRect();
      const btnRect = currentBtn.getBoundingClientRect();
      const scrollTop =
        yearGrid.scrollTop + (btnRect.top - gridRect.top) - gridRect.height / 2 + btnRect.height / 2;
      yearGrid.scrollTop = Math.max(0, scrollTop);
    }
  }

  private focusCurrentYearButton() {
    const currentBtn = this.querySelector(
      '.gui-calendar__year-button.current',
    ) as HTMLButtonElement;
    currentBtn?.focus();
  }

  private handleYearKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLButtonElement;
    if (!target.classList.contains('gui-calendar__year-button')) return;

    const buttons = Array.from(
      this.querySelectorAll<HTMLButtonElement>('.gui-calendar__year-button'),
    );
    const currentIndex = buttons.indexOf(target);
    const isRTL = window.getComputedStyle(this).direction === 'rtl';

    let step = 0;
    switch (event.key) {
      case 'ArrowLeft':
        step = isRTL ? 1 : -1;
        break;
      case 'ArrowRight':
        step = isRTL ? -1 : 1;
        break;
      case 'ArrowUp':
        step = -4;
        break;
      case 'ArrowDown':
        step = 4;
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const year = parseInt(target.dataset['year'] ?? '', 10);
        if (!isNaN(year)) this.selectYear(year);
        return;
      }
      case 'Escape': {
        event.preventDefault();
        // Move focus to year selector button BEFORE removing the year grid
        const yearBtn = this.querySelector(
          '.gui-calendar__year-selector',
        ) as HTMLButtonElement;
        yearBtn?.focus();
        this._yearSelectorOpen = false;
        return;
      }
      default:
        return;
    }

    event.preventDefault();
    const nextIndex = currentIndex + step;
    if (nextIndex >= 0 && nextIndex < buttons.length) {
      buttons[nextIndex].focus();
    }
  }

  protected get _effectiveMinYear(): number {
    return this.minDate ? new Date(this.minDate).getFullYear() : 1900;
  }

  protected get _effectiveMaxYear(): number {
    return this.maxDate ? new Date(this.maxDate).getFullYear() : 2099;
  }

  protected get _yearList(): number[] {
    const years: number[] = [];
    for (let y = this._effectiveMinYear; y <= this._effectiveMaxYear; y++) {
      years.push(y);
    }
    return years;
  }

  protected async handleKeydown(event: KeyboardEvent, day: AbstractCalendarDay) {
    const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
    if (!isNavKey && event.key !== ' ' && event.key !== 'Enter') return;

    const buttons = Array.from(
      this.querySelectorAll<HTMLButtonElement>('.gui-calendar__day-button:not(.other-month)'),
    );
    const currentIndex = buttons.indexOf(event.target as HTMLButtonElement);
    const isRTL = window.getComputedStyle(this).direction === 'rtl';

    let step = 0;
    switch (event.key) {
      case 'ArrowLeft':
        step = isRTL ? 1 : -1;
        break;
      case 'ArrowRight':
        step = isRTL ? -1 : 1;
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

      const panels = Array.from(this.querySelectorAll('.gui-calendar__panel'));
      let targetIndex: number;

      if (nextIndex < 0) {
        const firstPanelButtonCount = panels[0].querySelectorAll(
          '.gui-calendar__day-button:not(.other-month)',
        ).length;
        targetIndex = firstPanelButtonCount + nextIndex;
      } else {
        const lastPanel = panels[panels.length - 1];
        const lastPanelButtonCount = lastPanel.querySelectorAll(
          '.gui-calendar__day-button:not(.other-month)',
        ).length;
        targetIndex = newButtons.length - lastPanelButtonCount + (nextIndex - buttons.length);
      }

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

  /**
   * Splits an array of calendar days into chunks of weeks, with each week consisting of up to 7 days.
   *
   * @param {AbstractCalendarDay[]} days - An array of calendar day objects to be grouped into weeks.
   * @return {AbstractCalendarDay[][]} A two-dimensional array where each inner array represents a week of up to 7 days.
   */
  protected chunkDays(days: AbstractCalendarDay[]): AbstractCalendarDay[][] {
    const weeks: AbstractCalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }

  protected onFocusOut(e: FocusEvent) {
    if (e.relatedTarget && this.contains(e.relatedTarget as Node)) {
      return;
    }

    if (this._blurRafId !== undefined) {
      cancelAnimationFrame(this._blurRafId);
    }

    this._blurRafId = requestAnimationFrame(() => {
      this._blurRafId = undefined;
      if (!this.contains(document.activeElement)) {
        this.dispatchEvent(new CustomEvent('blur', { bubbles: true, composed: true }));
      }
    });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._blurRafId !== undefined) {
      cancelAnimationFrame(this._blurRafId);
    }
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
