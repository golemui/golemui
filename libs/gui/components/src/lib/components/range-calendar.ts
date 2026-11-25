import { property } from 'lit/decorators.js';
import { safeDefine } from '@golemui/lit-utils';
import { booleanAttribute } from '../utils/converters';
import { completeDateRange, toISODateString } from '../utils/date';
import { idleRangeSelection } from '../utils/range-selection';
import type { CompleteDateRange, DateRange } from '../types';
import { GuiRangeCalendarBase } from './range-calendar-base';
import { dispatchValue, fires, valueEvents, type GuiInputErrorEventDetail } from '../utils/events';

/**
 * A calendar to pick one date range: the first click picks the start, the second the end.
 *
 * ```html
 * <gui-range-calendar
 *   label="Stay"
 *   locale-id="en-US"
 *   value='{"start":"2026-03-02","end":"2026-03-06"}'
 * ></gui-range-calendar>
 * ```
 *
 * The value changes only when a range is complete: the first click starts a new pick and stops
 * painting the old range, the second sets the value. Escape, or focus leaving the calendar, drops
 * an unfinished pick. A range over a disabled day is rejected whole, and the value stays.
 *
 * @fires gui-input - The user picked a range. `detail.value` is the new value.
 * @fires gui-change - The user picked a range. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected the range the user picked, because it crosses a
 *   disabled day. `detail.message` is the error; show it through `errors`.
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
 * @cssprop --gui-range-bg - Background of the days inside the selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 */
export class GuiRangeCalendar extends GuiRangeCalendarBase {
  /** The date range, as `{ start, end }` ISO dates. Both ends are set, or the value is empty. */
  @property({ type: Object }) value: CompleteDateRange | undefined = undefined;
  /**
   * Set by a host picker, which holds an unfinished pick while its popup is closed: focus leaving
   * the calendar keeps the pick. Escape still drops it.
   *
   * @internal
   */
  @property({ attribute: 'hold-pick', converter: booleanAttribute }) holdPick: boolean | undefined =
    false;

  /** The value, when both ends are set. */
  private get range(): CompleteDateRange | undefined {
    return completeDateRange(this.value);
  }

  protected valueRanges(): DateRange[] {
    const range = this.range;
    return range ? [range] : [];
  }

  /** An unfinished pick hides the value: only the range being picked is painted. */
  protected override paintedRanges(): DateRange[] {
    return this._selection.anchor || this.workingSpan ? [] : this.valueRanges();
  }

  /** The form submits and validates the range the calendar paints, never a partial one. */
  protected override get controlValue(): unknown {
    return this.range;
  }

  protected override set controlValue(value: unknown) {
    this.value = value as CompleteDateRange | undefined;
  }

  /** A completed pick replaces the value. */
  protected commitPick(start: Date, end: Date): void {
    this._skipValueNavigation = true;
    this.value = { start: toISODateString(start), end: toISODateString(end) };
    dispatchValue(this, this.value);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.onHostKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onHostKeyDown);
  }

  /** Escape drops an unfinished pick, and goes no further: a host popup stays open. */
  private onHostKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this._selection.anchor) return;
    event.preventDefault();
    event.stopPropagation();
    this.dropPick();
  };

  protected override onFocusLeave(): void {
    if (!this.holdPick && this._selection.anchor) this.dropPick();
  }

  /** Forgets the unfinished pick, so the value is painted again. */
  private dropPick(): void {
    this._selection = idleRangeSelection();
    this.emitWorkingChange();
  }
}

/** The events `gui-range-calendar` fires, with their types. */
export const GuiRangeCalendarEvents = {
  ...valueEvents<GuiRangeCalendar['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change':
    fires<CustomEvent<{ anchor: string | null; start: string | null; end: string | null }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-range-calendar': GuiRangeCalendar;
  }
}

safeDefine('gui-range-calendar', GuiRangeCalendar);
