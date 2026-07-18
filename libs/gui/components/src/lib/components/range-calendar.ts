import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  createDateRange,
  DISABLED_DATE_RANGE_MESSAGE,
  getDayLabel,
  isDateInVisibleMonths,
  isSameDay,
  isToday,
  mergeDateRanges,
  parseISODateString,
  rangeSpansDisabledDay,
  toISODateString,
} from '../utils/date';
import { AbstractCalendar, type AbstractCalendarDay } from './abstract-calendar';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import type { DateRange } from '@golemui/gui-shared/internals';

export interface RangeCalendarDay extends AbstractCalendarDay {
  isToday: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  isOneDayRange: boolean;
  isAnchor: boolean;
  isSelecting: boolean;
  isInvalidStart: boolean;
  isInvalidEnd: boolean;
  isInvalidInRange: boolean;
}

@customElement('gui-range-calendar')
export class GuiRangeCalendar extends AbstractCalendar {
  @property({ type: Array }) value: DateRange[] | undefined = [];
  @property({ type: String }) focusDate: string | undefined = undefined;
  @property({ type: Boolean }) hidePills = false;
  @property({ type: String }) removePillAriaLabel: string | undefined = undefined;
  @property({ type: String, attribute: 'disabled-date-range-message' }) disabledDateRangeMessage:
    | string
    | undefined = undefined;
  @property({ attribute: false }) invalidRange: { start: string; end: string } | null = null;

  @state() protected _anchorDate: Date | null = null;
  @state() protected _nextDate: RangeCalendarDay | null = null;
  @state() protected _isSelecting = false;
  @state() protected _invalidRange: { start: Date; end: Date } | null = null;

  protected _skipValueNavigation = false;

  /**
   * Full instant of an endpoint, used to order the pills. Date-only here; a
   * subclass whose endpoints carry a time overrides it so two ranges on the
   * same day still sort by time.
   */
  protected parseEndpoint(iso: string): Date {
    return parseISODateString(iso);
  }

  /**
   * Midnight-truncated calendar day of an endpoint, used to highlight the day
   * grid.
   */
  protected endpointDay(iso: string): Date {
    return parseISODateString(iso);
  }

  /** Pill text for one committed range. */
  protected formatPillLabel(range: DateRange): string {
    const startFormatted = this.formatDateForDisplay(range.start);
    const endFormatted = range.end ? this.formatDateForDisplay(range.end) : startFormatted;
    return `${startFormatted} - ${endFormatted}`;
  }

  /** Day-button inner content. */
  protected renderDayContent(day: RangeCalendarDay): TemplateResult {
    return html`${day.dayLabel}`;
  }

  override createRenderRoot() {
    return this;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.classList.add('gui-field');
  }

  override willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('invalidRange')) {
      if (this.invalidRange) {
        const start = this.endpointDay(this.invalidRange.start);
        const end = this.endpointDay(this.invalidRange.end);
        this._invalidRange =
          isNaN(start.getTime()) || isNaN(end.getTime()) ? null : { start, end };
      } else {
        this._invalidRange = null;
      }
    }
    if (changedProperties.has('value') && !changedProperties.has('focusDate')) {
      if (this._skipValueNavigation) {
        this._skipValueNavigation = false;
      } else if (this.value) {
        const value = Array.isArray(this.value)
          ? this.value
          : [{ start: this.value as unknown as string }];

        if (value.length > 0 && value[0].start) {
          const date = this.endpointDay(value[0].start);
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
        const date = parseISODateString(this.focusDate);
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
    const isInvalidSingle = day.isInvalidStart && day.isInvalidEnd;
    const classes = {
      'gui-calendar__day-button': true,
      today: day.isToday,
      'other-month': !day.isCurrentMonth,
      'range-start': day.isRangeStart && !day.isOneDayRange,
      'range-end': day.isRangeEnd && !day.isOneDayRange,
      selected: day.isOneDayRange,
      'in-range': day.isInRange,
      'invalid-range-start': day.isInvalidStart && !isInvalidSingle,
      'invalid-range-end': day.isInvalidEnd && !isInvalidSingle,
      'invalid-range-single': isInvalidSingle,
      'invalid-in-range': day.isInvalidInRange,
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
        data-date=${toISODateString(day.date)}
        @click=${(e: MouseEvent) => this.selectDate(day, e)}
        @mouseover=${() => this.onMouseOver(day)}
        @focus=${() => this.onMouseOver(day)}
        @keydown=${(e: KeyboardEvent) => this.handleKeydown(e, day)}
        aria-selected=${day.isRangeStart || day.isRangeEnd || day.isInRange ? 'true' : 'false'}
      >
        ${this.renderDayContent(day)}
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
      const {
        isRangeStart,
        isRangeEnd,
        isInRange,
        isSelecting,
        isInvalidStart,
        isInvalidEnd,
        isInvalidInRange,
      } = this.checkDateStatus(date);
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
        isInvalidStart: isInvalidStart && isCurrentMonth,
        isInvalidEnd: isInvalidEnd && isCurrentMonth,
        isInvalidInRange: isInvalidInRange && isCurrentMonth,
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
          isDateInVisibleMonths(this.endpointDay(range.start), this._currentDate, months),
        ) ?? false;

      if (!todayVisible && !rangeStartVisible) {
        const firstDay = days.find((d) => d.isCurrentMonth && !d.isDisabled);
        if (firstDay) firstDay.isFocusable = true;
      }
    }

    return days;
  }

  protected checkDateStatus(date: Date) {
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;
    let isSelecting = false;
    let isInvalidStart = false;
    let isInvalidEnd = false;
    let isInvalidInRange = false;

    if (this._invalidRange) {
      const invalidStart = this._invalidRange.start;
      const invalidEnd = this._invalidRange.end;
      isInvalidStart = isSameDay(date, invalidStart);
      isInvalidEnd = isSameDay(date, invalidEnd);
      const dateTime = date.getTime();
      if (dateTime > invalidStart.getTime() && dateTime < invalidEnd.getTime()) {
        isInvalidInRange = true;
      }
    }

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
        const start = this.endpointDay(range.start);

        if (isSameDay(date, start)) {
          isRangeStart = true;
          isRangeEnd = !range.end;
        }

        if (range.end) {
          const end = this.endpointDay(range.end);

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

    return {
      isRangeStart,
      isRangeEnd,
      isInRange,
      isSelecting,
      isInvalidStart,
      isInvalidEnd,
      isInvalidInRange,
    };
  }

  override selectDate(day: RangeCalendarDay, _e: MouseEvent | KeyboardEvent | null = null) {
    if (!day.isCurrentMonth || this.disabled || this.readOnly) return;

    const clickedDate = day.date;

    // Start selection
    if (!this._anchorDate) {
      // Starting over clears any previously rejected range still shown in red.
      this._invalidRange = null;
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

    this._isSelecting = false;
    this._nextDate = null;
    this._anchorDate = null;

    // A range that spans any disabled day is rejected, throw error, and no pill added.
    if (
      rangeSpansDisabledDay(
        toISODateString(startDate),
        toISODateString(endDate),
        this.disabledRanges,
        this.minDate,
        this.maxDate,
      )
    ) {
      this._invalidRange = { start: startDate, end: endDate };
      this.dispatchEvent(
        new CustomEvent('inputError', {
          detail: {
            message: this.disabledDateRangeMessage ?? DISABLED_DATE_RANGE_MESSAGE,
            range: { start: toISODateString(startDate), end: toISODateString(endDate) },
          },
          bubbles: true,
          composed: true,
        }),
      );
      this.requestUpdate();
      return;
    }

    this._invalidRange = null;
    this._skipValueNavigation = true;
    this.value = mergeDateRanges([...(this.value || []), createDateRange(startDate, endDate)]);

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected onMouseOver(day: RangeCalendarDay) {
    if (this._isSelecting) {
      this._nextDate = day;
    }
  }

  // --- Pills ---

  override renderAboveCalendar() {
    if (this.hidePills) return nothing;

    const pills = this.getSortedPills();
    if (pills.length === 0) return nothing;

    const pillItems: GuiPillItem[] = pills.map((pill) => {
      const pillLabel = this.formatPillLabel(pill);
      return {
        key: `${pill.start}-${pill.end ?? pill.start}`,
        label: pillLabel,
        ariaLabel: `${this.removePillAriaLabel ?? 'Remove date'} ${pillLabel}`,
      };
    });

    return html`
      <gui-pills
        class="gui-range-calendar__pills"
        .items=${pillItems}
        .removable=${true}
        .clickable=${true}
        .bubble=${false}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        .removeAriaLabel=${this.removePillAriaLabel ?? 'Remove date'}
        @pillremove=${this.onPillRemoveEvent}
        @pillclick=${this.onPillClickEvent}
      ></gui-pills>
    `;
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    if (this.disabled || this.readOnly) return;
    const sorted = this.getSortedPills();
    const removed = sorted.find(
      (pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key,
    );
    if (!removed) return;
    const next = (this.value ?? []).filter(
      (pill) => !(pill.start === removed.start && (pill.end ?? null) === (removed.end ?? null)),
    );
    this.value = next;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    const sorted = this.getSortedPills();
    const range = sorted.find((pill) => `${pill.start}-${pill.end ?? pill.start}` === e.detail.key);
    if (range) this.navigateToDate(range.start);
  };

  private formatDateForDisplay(isoDate: string): string {
    const date = parseISODateString(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat(this.localeId ?? 'en', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  protected getSortedPills(): DateRange[] {
    if (!this.value || !Array.isArray(this.value)) return [];
    return [...this.value].sort(
      (a, b) => this.parseEndpoint(a.start).getTime() - this.parseEndpoint(b.start).getTime(),
    );
  }

  protected navigateToDate(isoDate: string) {
    const date = this.endpointDay(isoDate);
    if (
      !isNaN(date.getTime()) &&
      !isDateInVisibleMonths(date, this._currentDate, this.numberOfMonths ?? 1)
    ) {
      this._currentDate = date;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-calendar': GuiRangeCalendar;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('gui-range-calendar')) {
  customElements.define('gui-range-calendar', GuiRangeCalendar);
}
