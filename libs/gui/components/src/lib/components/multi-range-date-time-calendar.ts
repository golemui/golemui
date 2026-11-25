import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { GUIEditSessionController } from '../controllers/edit-session.controller';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import { toISODateString } from '../utils/date';
import {
  buildPillItems,
  findRangeByKey,
  removeRangeByKey,
  sameRanges,
  sortRangesByStart,
} from '../utils/pill-ranges';
import {
  formatISODateTimeForLocale,
  mergeDateTimeRanges,
  parseISODateTimeString,
  resolveHourFormat,
} from '../utils/time';
import { idleRangeSelection } from '../utils/range-selection';
import type { DateTimeRange } from '../types';
import {
  GuiRangeDateTimeCalendarBase,
  type DayBadge,
  type RangeDateTimeCalendarDay,
} from './range-date-time-calendar-base';
import {
  fires,
  stopPropagation,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, requiredName } from '../utils/messages';

/**
 * A calendar with start and end time pickers, to pick one or more date-time ranges.
 *
 * @fires gui-input - The user changed the value. `detail.value` is the new value.
 * @fires gui-change - The user committed the value. `detail.value` is the committed value.
 * @fires gui-blur - Focus left the control.
 * @fires gui-input-error - The element rejected what the user entered, such as an impossible date
 *   or a value out of bounds. `detail.message` is the error; show it through `errors`.
 * @fires gui-parts-change - The typed parts changed before they form a complete value, for a host
 *   that mirrors them.
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
 * @cssprop --gui-range-bg - Background of the days inside a selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiMultiRangeDateTimeCalendar extends GuiRangeDateTimeCalendarBase {
  /** The date-time ranges, as `{ start, end }` ISO date-times. */
  @property({ type: Array }) value: DateTimeRange[] | undefined = [];
  /** @internal */
  @property({ attribute: 'hide-pills', converter: booleanAttribute }) hidePills:
    | boolean
    | undefined = false;
  /** Accessible name of the remove button of each range pill. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /**
   * Read with a day that has several ranges, before the ranges themselves. `{count}` is the number
   * of ranges.
   */
  @property({ type: String, attribute: 'day-count-aria-label' }) dayCountAriaLabel:
    | string
    | undefined = undefined;
  /**
   * The host picker's allowEdit-selected range: its days are marked so the
   * range being inspected or edited stands out among its neighbors.
   *
   * @internal
   */
  @property({ attribute: 'selected-range' }) selectedRange: DateTimeRange | null = null;
  /**
   * Set by a host picker while an edit session is open: completed pieces park
   * as working state instead of committing — the session's explicit Confirm
   * owns the commit.
   *
   * @internal
   */
  @property({ attribute: 'defer-commit', converter: booleanAttribute }) deferCommit:
    | boolean
    | undefined = false;

  /** Lets the user edit a range in place from its pill. */
  @property({ attribute: 'allow-edit', converter: booleanAttribute }) allowEdit:
    | boolean
    | undefined = false;
  /** Tooltip of the edit button of a range pill. */
  @property({ type: String, attribute: 'edit-label' }) editLabel: string | undefined = undefined;
  /** Hint that a range pill can be edited. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-aria-label' }) editAriaLabel: string | undefined =
    undefined;
  /** Tooltip of the confirm button of a range being edited. */
  @property({ type: String, attribute: 'confirm-edit-label' }) confirmEditLabel:
    | string
    | undefined = undefined;
  /** Tooltip of the cancel button of a range being edited. */
  @property({ type: String, attribute: 'cancel-edit-label' }) cancelEditLabel: string | undefined =
    undefined;
  /** Announcement when editing a range starts. `{label}` is the range. */
  @property({ type: String, attribute: 'edit-started-message' }) editStartedMessage:
    | string
    | undefined = undefined;
  /** Announcement when an edited range is saved. `{label}` is the new range. */
  @property({ type: String, attribute: 'edit-committed-message' }) editCommittedMessage:
    | string
    | undefined = undefined;
  /** Announcement when editing a range is cancelled. */
  @property({ type: String, attribute: 'edit-cancelled-message' }) editCancelledMessage:
    | string
    | undefined = undefined;

  protected _edit = new GUIEditSessionController<DateTimeRange>(this, {
    isEnabled: () => this.editEnabled,
    getRanges: () => this.value,
    compareStarts: (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
    formatLabel: (range) => this.formatPillLabel(range),
    loadRange: (range) => this.loadRangeForEdit(range),
    clearCompose: () => this.clearCompose(),
    getPills: () => this.querySelector('gui-pills'),
    getMessages: () => ({
      started: message('editRangeStarted', this.editStartedMessage),
      committed: message('editRangeCommitted', this.editCommittedMessage),
      cancelled: message('editRangeCancelled', this.editCancelledMessage),
    }),
  });

  private get editEnabled(): boolean {
    return !!this.allowEdit && !this.disabled && !this.readOnly;
  }
  private loadRangeForEdit(range: DateTimeRange): void {
    const [startDay, startTime] = range.start.split('T');
    const [endDay, endTime] = (range.end ?? range.start).split('T');
    this._invalidRange = null;
    this._selection = idleRangeSelection();
    this._workingStart = startDay;
    this._workingEnd = endDay;
    this._workingStartTime = startTime;
    this._workingEndTime = endTime;
    this._nav.navigateToDate(this.endpointDay(range.start));
    this.emitPartsChange();
    void this.updateComplete.then(() => {
      this.querySelector<HTMLButtonElement>(
        `.gui-calendar__day-button[data-date="${startDay}"]`,
      )?.focus();
    });
  }

  private clearCompose(): void {
    this.resetWorking();
    this.emitPartsChange();
  }

  protected get blockClass(): string {
    return 'gui-multi-range-date-time-calendar';
  }

  /** A plain ISO date-time set from outside still counts as the start of one range. */
  protected valueRanges(): DateTimeRange[] {
    if (this.value && !Array.isArray(this.value)) {
      return [{ start: this.value as unknown as string, end: this.value as unknown as string }];
    }
    return this.value ?? [];
  }

  protected override markedRange(): DateTimeRange | null {
    return this.selectedRange ?? this._edit.selectedRange;
  }

  protected override get commitDeferred(): boolean {
    return !!this.deferCommit || !!this._edit.editing;
  }

  protected get settledValue(): unknown {
    return this.value ?? [];
  }

  protected commitPick() {
    return this.commitWorking(this.value ?? []);
  }

  /**
   * Merges the working range into `base`. While editing, a result equal to the value is
   * `unchanged`, which the session reads as a cancel.
   */
  private commitWorking(
    base: DateTimeRange[],
  ): { kind: 'committed'; start: string } | { kind: 'incomplete' | 'rejected' | 'unchanged' } {
    const resolved = this.resolveWorking();
    if (resolved.kind !== 'range') return resolved;
    const ordered = resolved.range;

    const next = mergeDateTimeRanges([...base, ordered]);
    if (
      this._edit.editing &&
      sameRanges(
        this.getSortedPills(),
        sortRangesByStart(
          next,
          (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
        ),
      )
    ) {
      return { kind: 'unchanged' };
    }

    this.applyCommittedValue(next);
    return { kind: 'committed', start: ordered.start };
  }

  /** Leaving settles an open edit session first: a complete replacement commits. */
  protected override settleOnLeave(): void {
    if (this._edit.editing) {
      const outcome = this.commitWorking(this._edit.baseRanges(this.value));
      if (outcome.kind === 'committed') {
        this._edit.completed(outcome.start, { focus: false });
      }
      if (this._edit.editing) this._edit.cancel();
      this._edit.handleFocusLeave();
      return;
    }
    this._edit.handleFocusLeave();
    super.settleOnLeave();
  }

  /**
   * Full instant of an endpoint, used to order the pills — endpoints carry a
   * time, so two ranges on the same day still sort by time.
   */
  protected parseEndpoint(iso: string): Date {
    return parseISODateTimeString(iso);
  }

  /** Pill text for one committed range. */
  protected formatPillLabel(range: DateTimeRange): string {
    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const start = formatISODateTimeForLocale(range.start, this.localeId, hourFormat);
    const end = range.end
      ? formatISODateTimeForLocale(range.end, this.localeId, hourFormat)
      : start;
    return `${start} - ${end}`;
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
   * Escape layering below the year grid and the time-picker lists (which
   * consume their own Escape while open): first cancels an open edit session,
   * then clears the selection.
   */
  private onHostKeyDown = (e: KeyboardEvent) => {
    this._edit.handleEscape(e);
  };

  override willUpdate(changedProperties: PropertyValues): void {
    this._edit.reconcileValue(this.value);
    super.willUpdate(changedProperties);
  }

  /** A day's bubbles: how many ranges it holds, then its disabled times. */
  protected override dayBadges(day: RangeDateTimeCalendarDay): DayBadge[] {
    const count = this.rangeCountBadge(day);
    return count ? [count, ...super.dayBadges(day)] : super.dayBadges(day);
  }

  private rangeCountBadge(day: RangeDateTimeCalendarDay): DayBadge | null {
    if (!day.isCurrentMonth) return null;
    const ranges = this.rangesOnDay(day.date);
    if (ranges.length <= 1) return null;

    const labels = ranges.map((range) => this.formatPillLabel(range));
    const text = `${message('dayRangeCount', this.dayCountAriaLabel, {
      count: ranges.length,
    })}: ${labels.join(', ')}`;
    return { kind: 'day-count', count: ranges.length, text, labels };
  }

  /** Committed ranges covering `date`, a range counts on every day of its span. */
  private rangesOnDay(date: Date): DateTimeRange[] {
    if (!this.value?.length) return [];
    const iso = toISODateString(date);
    return this.value.filter((range) => {
      const start = range.start.split('T')[0];
      const end = (range.end ?? range.start).split('T')[0];
      return iso >= start && iso <= end;
    });
  }

  // --- Pills ---

  /** @internal */
  override renderAboveCalendar(): TemplateResult | typeof nothing {
    const liveRegion = this.allowEdit
      ? html`<div class="gui-visually-hidden" aria-live="polite">${this._edit.announcement}</div>`
      : nothing;

    if (this.hidePills) return liveRegion;

    const pills = this.getSortedPills();
    if (pills.length === 0) return liveRegion;

    const pillItems: GuiPillItem[] = this.decoratePillItems(
      buildPillItems(pills, (pill) => this.formatPillLabel(pill)),
    );

    return html`
      ${liveRegion}
      <gui-pills
        class="gui-multi-range-calendar__pills"
        .uid=${this.uid}
        .idPrefix=${this.idPrefix}
        .toolbarAriaLabel=${message('selectedDateTimeRanges')}
        .items=${pillItems}
        .removable=${true}
        .clickable=${true}
        .bubble=${false}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        .removeAriaLabel=${requiredName('removeDateTime', this.removePillAriaLabel)}
        .editable=${this.editEnabled}
        .selectedKey=${this._edit.selectedKey ?? undefined}
        .editingKey=${this._edit.editing?.key ?? undefined}
        .editLabel=${requiredName('editRange', this.editLabel)}
        .confirmEditLabel=${requiredName('confirmEditRange', this.confirmEditLabel)}
        .cancelEditLabel=${requiredName('cancelEditRange', this.cancelEditLabel)}
        @gui-pill-remove=${this.onPillRemoveEvent}
        @gui-pill-click=${this.onPillClickEvent}
        @gui-pill-focus=${this.onPillFocusEvent}
        @gui-pills-blur=${this.onPillsBlurEvent}
        @gui-pill-edit=${this.onPillEditEvent}
        @gui-pill-edit-confirm=${this.onPillEditConfirm}
        @gui-pill-edit-cancel=${this.onPillEditCancel}
        @gui-pill-keydown=${stopPropagation}
        @gui-pill-exit=${stopPropagation}
      ></gui-pills>
    `;
  }

  /**
   * allowEdit decoration on the pill items: the editing pill's label
   * live-previews the working pieces, and every pill carries the interpolated
   * edit hint for its `aria-description`.
   */
  private decoratePillItems(items: GuiPillItem[]): GuiPillItem[] {
    if (!this.editEnabled) return items;
    const editingKey = this._edit.editing?.key;
    return items.map((item) => {
      const label = item.key === editingKey ? this.workingLabel() : item.label;
      return {
        ...item,
        label,
        ariaLabel: label,
        editAriaLabel: message('editRangeHint', this.editAriaLabel, { label: item.label }),
      };
    });
  }

  /** The live label of the range being reshaped, one `…` per incomplete endpoint. */
  private workingLabel(): string {
    const hourFormat = resolveHourFormat(this.localeId, this.hourFormat);
    const format = (day: string | undefined, time: string | undefined) =>
      day && time ? formatISODateTimeForLocale(`${day}T${time}`, this.localeId, hourFormat) : '…';
    return `${format(this._workingStart, this._workingStartTime)} - ${format(
      this._workingEnd,
      this._workingEndTime,
    )}`;
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    this.emitChange(removal.next);
  };

  private onPillClickEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    const range = findRangeByKey(this.getSortedPills(), e.detail.key);
    if (!range) return;
    const outcome = this._edit.handlePillClick(e.detail.key);
    if (outcome === 'cancelled') return;
    this.navigateToDate(range.start);
  };

  /**
   * Keyboard navigation landed on a pill: the selection follows focus, so the
   * focused pill offers the edit affordance and drives the day marking.
   */
  private onPillFocusEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (!this.editEnabled || this._edit.editing) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
  };

  /**
   * Focus left the pills for elsewhere: the selection follows it away. An open
   * session keeps its selection — its focus legitimately lives in the day grid
   * or the time pickers.
   */
  private onPillsBlurEvent = (e: Event) => {
    e.stopPropagation();
    if (this._edit.editing) return;
    this._edit.clearSelection();
  };

  /** Edit icon or F2 / E on a pill: select it (if needed) and start editing. */
  private onPillEditEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (!this.editEnabled || this._edit.editing?.key === e.detail.key) return;
    if (this._edit.selectedKey !== e.detail.key) this._edit.handlePillClick(e.detail.key);
    this._edit.startEdit();
  };

  private onPillEditConfirm = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    const outcome = this.commitWorking(this._edit.baseRanges(this.value));
    if (outcome.kind === 'committed') {
      this._edit.completed(outcome.start);
      return;
    }
    if (outcome.kind === 'unchanged') {
      this._edit.cancel();
      this._edit.focusSelectedPill();
      return;
    }
    if (outcome.kind === 'incomplete') {
      this.emitInputError(message('incompleteDateTime', this.incompleteMessage));
    }
  };

  private onPillEditCancel = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this._edit.cancel();
    this._edit.focusSelectedPill();
  };

  protected getSortedPills(): DateTimeRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
    );
  }
}

/** The events `gui-multi-range-date-time-calendar` fires, with their types. */
export const GuiMultiRangeDateTimeCalendarEvents = {
  ...valueEvents<GuiMultiRangeDateTimeCalendar['value']>(),
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
    'gui-multi-range-date-time-calendar': GuiMultiRangeDateTimeCalendar;
  }
}

safeDefine('gui-multi-range-date-time-calendar', GuiMultiRangeDateTimeCalendar);
