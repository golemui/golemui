import { type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { completeRange } from '../utils/range-commit';
import { idleRangeSelection } from '../utils/range-selection';
import type { DateTimeRange } from '../types';
import { GuiRangeDateTimeCalendarBase } from './range-date-time-calendar-base';
import { fires, valueEvents, type GuiInputErrorEventDetail } from '../utils/events';

const dayOf = (iso: string) => iso.split('T')[0];
const timeOf = (iso: string | undefined) => (iso ? iso.split('T')[1] : undefined);

/**
 * A calendar with start and end time pickers, to pick one date-time range.
 *
 * ```html
 * <gui-range-date-time-calendar
 *   label="Rental"
 *   locale-id="en-US"
 *   minute-step="30"
 *   value='{"start":"2026-03-02T09:00:00","end":"2026-03-06T17:00:00"}'
 * ></gui-range-date-time-calendar>
 * ```
 *
 * The time pickers show the range's times. Two clicks on the days pick a new range with those
 * times: the first starts it and stops painting the old one, the second sets the value. Picking a
 * time changes that time of the range. Escape, or focus leaving the calendar, drops an unfinished
 * pick. A range over a disabled span or outside `minDateTime`/`maxDateTime` is rejected whole.
 *
 * @fires gui-input - The user picked a range. `detail.value` is the new value.
 * @fires gui-change - The user picked a range. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user picked, such as a range over a
 *   disabled span. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The unfinished pick changed, for a host that mirrors it.
 * @cssprop --gui-calendar-width - Width of one month.
 * @cssprop --gui-calendar-day-button-size - Size of each day.
 * @cssprop --gui-calendar-change-month-button-width - Width of the previous- and next-month
 *   buttons.
 * @cssprop --gui-calendar-change-month-button-height - Height of the previous- and next-month
 *   buttons.
 * @cssprop --gui-calendar-year-button-width - Width of each year in the year grid.
 * @cssprop --gui-calendar-year-button-height - Height of each year in the year grid.
 * @cssprop --gui-calendar-year-grid-height - Height of the year grid.
 * @cssprop --gui-calendar-time-grid-height - Height of the time grid.
 * @cssprop --gui-calendar-time-button-height - Height of each time in the grid.
 * @cssprop --gui-range-bg - Background of the days inside the selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 */
export class GuiRangeDateTimeCalendar extends GuiRangeDateTimeCalendarBase {
  /**
   * The date-time range, as `{ start, end }` local ISO date-times. Both ends are set, or the value
   * is empty.
   */
  @property({ type: Object }) value: DateTimeRange | undefined = undefined;

  /** Set while the element sets its own value, so the time pickers keep what the user picked. */
  private _ownCommit = false;

  protected get blockClass(): string {
    return 'gui-range-date-time-calendar';
  }

  /** The value, when both ends are set. */
  private get range(): DateTimeRange | undefined {
    return completeRange(this.value);
  }

  protected valueRanges(): DateTimeRange[] {
    const range = this.range;
    return range ? [range] : [];
  }

  /** Whether days are being picked: then the value is not painted. */
  private get pickingDays(): boolean {
    return !!this._selection.anchor || !!this._workingStart || !!this._workingEnd;
  }

  /** An unfinished day pick hides the value: only the range being picked is painted. */
  protected override paintedRanges(): DateTimeRange[] {
    return this.pickingDays ? [] : this.valueRanges();
  }

  protected get settledValue(): unknown {
    return this.range ?? null;
  }

  /** The form submits and validates the range the calendar paints, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as DateTimeRange | undefined;
  }

  /**
   * A complete pick replaces the value. With no days being picked, a changed time applies to the
   * value's days. The times stay in the pickers, so the next pick of days keeps them.
   */
  protected commitPick(): { kind: 'committed' | 'incomplete' | 'rejected' | 'unchanged' } {
    const range = this.range;
    const filledDays = !this.pickingDays && !!range;
    if (filledDays && range) {
      this._workingStart = dayOf(range.start);
      this._workingEnd = dayOf(range.end);
    }

    const resolved = this.resolveWorking();
    if (resolved.kind !== 'range' || (range && sameRange(resolved.range, range))) {
      if (filledDays) {
        this._workingStart = undefined;
        this._workingEnd = undefined;
      }
      return resolved.kind === 'range' ? { kind: 'unchanged' } : resolved;
    }

    this._skipValueNavigation = true;
    this._ownCommit = true;
    this.value = { start: resolved.range.start, end: resolved.range.end };
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._selection = idleRangeSelection();
    this._invalidRange = null;
    this.emitPartsChange();
    this.emitChange(this.value);
    return { kind: 'committed' };
  }

  /** A value set from outside shows its times in the time pickers. */
  override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (!changedProperties.has('value')) return;
    if (this._ownCommit) {
      this._ownCommit = false;
      return;
    }
    this.showValueTimes();
  }

  private showValueTimes(): void {
    const range = this.range;
    this._workingStartTime = timeOf(range?.start);
    this._workingEndTime = timeOf(range?.end);
  }

  /** Whether anything differs from the value: days being picked, or a time not yet applied. */
  private get pickInProgress(): boolean {
    const range = this.range;
    return (
      this.pickingDays ||
      this._workingStartTime !== timeOf(range?.start) ||
      this._workingEndTime !== timeOf(range?.end)
    );
  }

  /** Forgets the unfinished pick, so the value is painted and its times shown again. */
  private dropPick(): void {
    this._selection = idleRangeSelection();
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._invalidRange = null;
    this.showValueTimes();
    this.emitPartsChange();
  }

  /**
   * Leaving commits a complete pick and drops an unfinished one, instead of reporting it: the value
   * is what the calendar showed before.
   */
  protected override settleOnLeave(): void {
    if (this.tryCommitWorkingRange()) return;
    if (this.pickInProgress) this.dropPick();
    if (this._surfacedError) this.emitChange(this.settledValue);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onHostKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onHostKeyDown);
  }

  /**
   * Escape drops an unfinished day pick, and goes no further: a host popup stays open. An open
   * time list or the year grid consumes its own Escape first.
   */
  private onHostKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.pickingDays) return;
    event.preventDefault();
    event.stopPropagation();
    this.dropPick();
  };
}

function sameRange(a: DateTimeRange, b: DateTimeRange): boolean {
  return a.start === b.start && a.end === b.end;
}

/** The events `gui-range-date-time-calendar` fires, with their types. */
export const GuiRangeDateTimeCalendarEvents = {
  ...valueEvents<GuiRangeDateTimeCalendar['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change': fires<
    CustomEvent<{
      anchor: string | null;
      start: string | null;
      end: string | null;
      startTime: string | null;
      endTime: string | null;
    }>
  >(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-date-time-calendar': GuiRangeDateTimeCalendar;
  }
}

safeDefine('gui-range-date-time-calendar', GuiRangeDateTimeCalendar);
