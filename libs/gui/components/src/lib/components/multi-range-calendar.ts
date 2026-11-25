import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { booleanAttribute } from '../utils/converters';
import { safeDefine } from '@golemui/lit-utils';
import { GUIEditSessionController } from '../controllers/edit-session.controller';
import {
  createDateRange,
  mergeDateRanges,
  parseISODateString,
  toISODateString,
} from '../utils/date';
import {
  buildPillItems,
  findRangeByKey,
  formatISODateForDisplay,
  formatRangeLabel,
  removeRangeByKey,
  sameRanges,
  sortRangesByStart,
} from '../utils/pill-ranges';
import { idleRangeSelection } from '../utils/range-selection';
import './pills';
import type { GuiPillEventDetail, GuiPillItem } from './pills';
import type { DateRange } from '../types';
import { GuiRangeCalendarBase, type RangeCalendarDay } from './range-calendar-base';
import {
  stopPropagation,
  dispatchValue,
  fires,
  valueEvents,
  type GuiInputErrorEventDetail,
} from '../utils/events';
import { message, requiredName } from '../utils/messages';

/** One day of the multi-range calendar's grid. */
export type MultiRangeCalendarDay = RangeCalendarDay;

/**
 * A calendar to pick one or more date ranges.
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
 * @cssprop --gui-range-bg - Background of the days inside a selected range.
 * @cssprop --gui-range-error-bg - Background of the days inside a rejected range.
 * @cssprop --gui-pill-height - Height of each pill.
 * @cssprop --gui-pill-font-size - Font size of the pill text.
 * @cssprop --gui-pill-action-size - Size of the icons inside a pill.
 * @cssprop --gui-pill-action-hit - Clickable area of the buttons inside a pill.
 */
export class GuiMultiRangeCalendar extends GuiRangeCalendarBase {
  /** The date ranges, as `{ start, end }` ISO dates. */
  @property({ type: Array }) value: DateRange[] | undefined = [];
  /** @internal */
  @property({ attribute: 'hide-pills', converter: booleanAttribute }) hidePills:
    | boolean
    | undefined = false;
  /** Accessible name of the remove button of each range pill. An empty value keeps the default. */
  @property({ type: String, attribute: 'remove-pill-aria-label' }) removePillAriaLabel:
    | string
    | undefined = undefined;
  /**
   * The host picker's allowEdit-selected range: its days are marked so the
   * range being inspected or edited stands out among its neighbors.
   *
   * @internal
   */
  @property({ attribute: 'selected-range' }) selectedRange: DateRange | null = null;
  /**
   * Set by a host picker while an edit session is open: a completed two-click
   * span parks as the working selection (dotted preview) instead of merging
   * into the value — the session's explicit Confirm owns the commit.
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

  protected _edit = new GUIEditSessionController<DateRange>(this, {
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

  protected get editEnabled(): boolean {
    return !!this.allowEdit && !this.disabled && !this.readOnly;
  }

  /** A plain ISO date set from outside still counts as the start of one range. */
  protected valueRanges(): DateRange[] {
    if (this.value && !Array.isArray(this.value)) {
      return [{ start: this.value as unknown as string }];
    }
    return this.value ?? [];
  }

  protected override markedRange(): DateRange | null {
    return this.selectedRange ?? this._edit.selectedRange;
  }

  /**
   * Full instant of an endpoint, used to order the pills. Date-only here; a
   * subclass whose endpoints carry a time overrides it so two ranges on the
   * same day still sort by time.
   */
  protected parseEndpoint(iso: string): Date {
    return parseISODateString(iso);
  }

  /** Pill text for one committed range. */
  protected formatPillLabel(range: DateRange): string {
    return formatRangeLabel(range, (iso) => formatISODateForDisplay(iso, this.localeId));
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
   * Escape layering below the year grid (which consumes its own Escape):
   * first cancels an open edit session, then clears the selection.
   */
  private onHostKeyDown = (e: KeyboardEvent) => {
    this._edit.handleEscape(e);
  };

  override willUpdate(changedProperties: PropertyValues): void {
    this._edit.reconcileValue(this.value);
    super.willUpdate(changedProperties);
  }

  protected override onFocusLeave(): void {
    this.settleEditOnLeave();
  }

  /**
   * An open edit session, or a host picker that defers the commit, parks the span as the working
   * selection; otherwise it merges into the value.
   */
  protected commitPick(start: Date, end: Date): void {
    if (this.deferCommit || this._edit.editing) {
      this._workingStart = toISODateString(start);
      this._workingEnd = toISODateString(end);
      this._selection = idleRangeSelection();
      this.emitWorkingChange();
      return;
    }

    this.commitWorking(start, end, this.value || []);
  }

  /** Merges one ordered span into `base` and emits the resulting value. */
  private commitWorking(start: Date, end: Date, base: DateRange[]): DateRange[] {
    this._skipValueNavigation = true;
    this.value = mergeDateRanges([...base, createDateRange(start, end)]);

    dispatchValue(this, this.value);
    return this.value;
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
        .toolbarAriaLabel=${message('selectedDateRanges')}
        .items=${pillItems}
        .removable=${true}
        .clickable=${true}
        .bubble=${false}
        ?disabled=${this.disabled}
        ?readonly=${this.readOnly}
        .removeAriaLabel=${requiredName('removeDate', this.removePillAriaLabel)}
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
   * live-previews the working span, and every pill carries the interpolated
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

  /** The live label of the span being re-picked, one `…` per empty endpoint. */
  private workingLabel(): string {
    const format = (iso: string | undefined) =>
      iso ? formatISODateForDisplay(iso, this.localeId) : '…';
    return `${format(this._workingStart)} - ${format(this._workingEnd)}`;
  }

  /**
   * Loads the pill's span as the parked working selection (dotted preview) and
   * moves focus to its start day, where re-picking begins.
   */
  private loadRangeForEdit(range: DateRange): void {
    this._invalidRange = null;
    this._selection = idleRangeSelection();
    this._workingStart = range.start;
    this._workingEnd = range.end ?? range.start;
    this._nav.navigateToDate(this.endpointDay(range.start));
    this.emitWorkingChange();
    void this.updateComplete.then(() => {
      this.querySelector<HTMLButtonElement>(
        `.gui-calendar__day-button[data-date="${range.start}"]`,
      )?.focus();
    });
  }

  private clearCompose(): void {
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._selection = idleRangeSelection();
    this.emitWorkingChange();
  }

  /**
   * Commits the parked working span as the replacement of the range being
   * edited. An unchanged result confirms-as-cancel; an incomplete span (a lone
   * anchor) leaves the session open, waiting for the second pick.
   */
  private commitEditFromWorking({ refocus = true }: { refocus?: boolean } = {}): void {
    const span = this.workingSpan;
    if (!span) return;

    const base = this._edit.baseRanges(this.value);
    const next = mergeDateRanges([...base, createDateRange(span.start, span.end)]);
    if (
      sameRanges(
        this.getSortedPills(),
        sortRangesByStart(
          next,
          (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
        ),
      )
    ) {
      this._edit.cancel();
      if (refocus) this._edit.focusSelectedPill();
      return;
    }

    const committedStart = toISODateString(span.start);
    this._invalidRange = null;
    this._workingStart = undefined;
    this._workingEnd = undefined;
    this._selection = idleRangeSelection();
    this.emitWorkingChange();
    this.commitWorking(span.start, span.end, base);
    this._edit.completed(committedStart, { focus: refocus });
  }

  /**
   * Focus left the calendar: a complete re-picked span is finished work and
   * commits as the replacement (without stealing focus back); anything less
   * cancels silently. The selection follows focus away in every case.
   */
  private settleEditOnLeave(): void {
    if (this._edit.editing) {
      this.commitEditFromWorking({ refocus: false });
      if (this._edit.editing) this._edit.cancel();
    }
    this._edit.handleFocusLeave();
  }

  private onPillRemoveEvent = (e: CustomEvent<GuiPillEventDetail>) => {
    e.stopPropagation();
    if (this.disabled || this.readOnly) return;
    const removal = removeRangeByKey(this.value, e.detail.key);
    if (!removal) return;
    this.value = removal.next;
    dispatchValue(this, this.value);
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
   * session keeps its selection — its focus legitimately lives in the day grid.
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
    this.commitEditFromWorking();
  };

  private onPillEditCancel = (e: Event) => {
    e.stopPropagation();
    if (!this._edit.editing) return;
    this._edit.cancel();
    this._edit.focusSelectedPill();
  };

  protected getSortedPills(): DateRange[] {
    return sortRangesByStart(
      this.value,
      (a, b) => this.parseEndpoint(a).getTime() - this.parseEndpoint(b).getTime(),
    );
  }
}

/** The events `gui-multi-range-calendar` fires, with their types. */
export const GuiMultiRangeCalendarEvents = {
  ...valueEvents<GuiMultiRangeCalendar['value']>(),
  'gui-input-error': fires<CustomEvent<GuiInputErrorEventDetail>>(),
  'gui-parts-change':
    fires<CustomEvent<{ anchor: string | null; start: string | null; end: string | null }>>(),
};

declare global {
  interface HTMLElementTagNameMap {
    'gui-multi-range-calendar': GuiMultiRangeCalendar;
  }
}

safeDefine('gui-multi-range-calendar', GuiMultiRangeCalendar);
