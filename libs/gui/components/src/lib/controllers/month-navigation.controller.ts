import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import type { DateRange } from '@golemui/gui-shared/internals';
import {
  isDateDisabled,
  isDateInVisibleMonths,
  parseISODateString,
  toISODateString,
} from '../utils/date';

export type GUIMonthNavigationHost = ReactiveControllerHost;

export interface GUIMonthNavigationControllerOptions {
  /** The host's `minDate` property (ISO date, inclusive); falsy = unbounded. */
  getMinDate(): string | undefined;
  /** The host's `maxDate` property (ISO date, inclusive); falsy = unbounded. */
  getMaxDate(): string | undefined;
  /** The host's `numberOfMonths` property. */
  getNumberOfMonths(): number | undefined;
  /** The host's `disabledRanges` property, for {@link GUIMonthNavigationController.isDisabled}. */
  getDisabledRanges(): DateRange[] | undefined;
  /** Fired after every {@link GUIMonthNavigationController.toggleYearSelector} flip */
  onYearSelectorToggled?(): void;
}

/**
 * Month/year navigation state shared by the calendar components.
 */
export class GUIMonthNavigationController implements ReactiveController {
  private host: GUIMonthNavigationHost;
  private options: GUIMonthNavigationControllerOptions;

  private _currentDate: Date = new Date();
  private _yearSelectorOpen = false;

  constructor(host: GUIMonthNavigationHost, options: GUIMonthNavigationControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    // no-op: the controller holds state only — the hosts' templates read it
    // and call the mutators.
  }

  /** The first visible month. */
  get currentDate(): Date {
    return this._currentDate;
  }

  set currentDate(date: Date) {
    if (Object.is(date, this._currentDate)) return;
    this._currentDate = date;
    this.host.requestUpdate();
  }

  /** Whether the year grid is open. */
  get yearSelectorOpen(): boolean {
    return this._yearSelectorOpen;
  }

  set yearSelectorOpen(open: boolean) {
    if (Object.is(open, this._yearSelectorOpen)) return;
    this._yearSelectorOpen = open;
    this.host.requestUpdate();
  }

  prevMonth(): void {
    const d = this._currentDate;
    this.currentDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  }
  nextMonth(): void {
    const d = this._currentDate;
    this.currentDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  /**
   * Determines whether navigation to the previous month is allowed.
   *
   * This method checks if the last day of the previous month exceeds the allowed minimum date.
   * If there is no minimum date defined, navigation is always allowed.
   *
   * @return {boolean} Returns true if navigation to the previous month is permitted; otherwise, returns false.
   */
  canGoPrev(): boolean {
    const minDate = this.options.getMinDate();
    if (!minDate) return true;

    const prevMonthDate = new Date(
      this._currentDate.getFullYear(),
      this._currentDate.getMonth(),
      0,
    );
    const prevMonthStr = toISODateString(prevMonthDate);
    return prevMonthStr >= minDate;
  }

  /**
   * Determines whether navigation to the next month is allowed.
   *
   * This method checks if the first day of the next month exceeds the allowed maximum date.
   * If there is no maximum date defined, navigation is always allowed.
   *
   * @return {boolean} Returns true if navigation to the next month is permitted; otherwise, returns false.
   */
  canGoNext(): boolean {
    const maxDate = this.options.getMaxDate();
    if (!maxDate) return true;

    const lastVisibleMonthOffset = (this.options.getNumberOfMonths() ?? 1) - 1;
    const nextMonthDate = new Date(
      this._currentDate.getFullYear(),
      this._currentDate.getMonth() + lastVisibleMonthOffset + 1,
      1,
    );
    const nextMonthStr = toISODateString(nextMonthDate);

    return nextMonthStr <= maxDate;
  }

  /** First selectable year: `minDate`'s year, or the 1900 floor. */
  get effectiveMinYear(): number {
    const minDate = this.options.getMinDate();
    return minDate ? parseISODateString(minDate).getFullYear() : 1900;
  }

  /** Last selectable year: `maxDate`'s year, or the 2099 ceiling. */
  get effectiveMaxYear(): number {
    const maxDate = this.options.getMaxDate();
    return maxDate ? parseISODateString(maxDate).getFullYear() : 2099;
  }

  /** The year-grid entries, min..max inclusive. */
  get yearList(): number[] {
    const years: number[] = [];
    for (let y = this.effectiveMinYear; y <= this.effectiveMaxYear; y++) {
      years.push(y);
    }
    return years;
  }

  /** Flips the year grid and fires `onYearSelectorToggled` */
  toggleYearSelector(): void {
    this.yearSelectorOpen = !this._yearSelectorOpen;
    this.options.onYearSelectorToggled?.();
  }

  /** Applies a picked year: jump to the same month of `year` and close the year grid. */
  selectYear(year: number): void {
    this.currentDate = new Date(year, this._currentDate.getMonth(), 1);
    this.yearSelectorOpen = false;
  }

  /** Closes the year grid. */
  closeYearSelector(): void {
    this.yearSelectorOpen = false;
  }

  /**
   * Navigates so `date` becomes visible — a no-op for invalid dates and for
   * dates already inside the visible months.
   */
  navigateToDate(date: Date): void {
    if (
      !isNaN(date.getTime()) &&
      !isDateInVisibleMonths(date, this._currentDate, this.options.getNumberOfMonths() ?? 1)
    ) {
      this.currentDate = date;
    }
  }

  /** Whether a day is outside min/max or inside a disabled range. */
  isDisabled(date: Date): boolean {
    return isDateDisabled(
      toISODateString(date),
      this.options.getMinDate(),
      this.options.getMaxDate(),
      this.options.getDisabledRanges(),
    );
  }
}
