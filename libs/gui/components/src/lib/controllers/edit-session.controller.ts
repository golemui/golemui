import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import type { GuiPills } from '../components/pills';
import {
  excludeRangeByKey,
  findRangeByKey,
  indexOfRangeContaining,
  rangeKey,
  sortRangesByStart,
  type RangeLike,
} from '../utils/pill-ranges';
import { formatEditMessage } from '../utils/messages';

export type GUIEditSessionHost = ReactiveControllerHost & HTMLElement;

/**
 * How a pill click was routed through the session:
 *   - 'ignored'    — allowEdit is off; the host keeps its legacy behavior
 *   - 'selected'   — the pill is (or stays) the selection (the host should
 *                    still run its navigate-on-click behavior)
 *   - 'cancelled'  — the editing pill was clicked: the session was cancelled,
 *                    the selection kept
 */
export type GUIEditSessionPillClick = 'ignored' | 'selected' | 'cancelled';

/** Resolved announcement templates; `{label}` is interpolated per event. */
export interface GUIEditSessionMessages {
  started: string;
  committed: string;
  cancelled: string;
}

export interface GUIEditSessionOptions<R extends RangeLike> {
  /** `allowEdit && !disabled && !readOnly`. */
  isEnabled(): boolean;
  /** The host's current value. */
  getRanges(): readonly R[] | undefined;
  /** Start-endpoint comparator matching the host's pill sort. */
  compareStarts(a: string, b: string): number;
  /** The pill display label — announcement and aria-label source. */
  formatLabel(range: R): string;
  /** Paints the range into the compose surface (overwriting any add partial). */
  loadRange(range: R): void;
  /** Clears the compose surface and its surfaced errors. */
  clearCompose(): void;
  /** Selection or session changed: dispatch internal events, sync mirrors. */
  onStateChanged(): void;
  /** The strip, for post-commit / post-cancel focus restoration. */
  getPills(): GuiPills | null;
  getMessages(): GUIEditSessionMessages;
}

/**
 * The select → edit → confirm session behind `allowEdit` on the range
 * widgets. Owns the two pieces of state that flow into `<gui-pills>`
 * (`selectedKey`, `editingKey`) and the aria-live announcement text; the host
 * owns the compose surface, the commit (via {@link baseRanges}) and the
 * template bindings.
 *
 * The value array is never touched while a session is open — the original
 * pill keeps its key, cancel needs no snapshot, and `change` only fires when
 * the host commits the replacement.
 */
export class GUIEditSessionController<R extends RangeLike> implements ReactiveController {
  private host: GUIEditSessionHost;
  private options: GUIEditSessionOptions<R>;

  private _selectedKey: string | null = null;
  private _editing: { key: string; range: R } | null = null;
  private _announcement = '';

  constructor(host: GUIEditSessionHost, options: GUIEditSessionOptions<R>) {
    this.host = host;
    this.options = options;
    host.addController(this);
  }

  hostConnected(): void {
    // no-op: the controller attaches no listeners of its own — the host's
    // template binds pill clicks, keydowns and the pill action icons.
  }

  get selectedKey(): string | null {
    return this._selectedKey;
  }

  /** The selected range resolved against the current value, or null. */
  get selectedRange(): R | null {
    if (!this._selectedKey) return null;
    return findRangeByKey(this.options.getRanges() ?? [], this._selectedKey) ?? null;
  }

  get editing(): { key: string; range: R } | null {
    return this._editing;
  }

  /** Current aria-live text; render into the host's visually-hidden region. */
  get announcement(): string {
    return this._announcement;
  }

  /** Routes a `pillclick` key. Call before the host's legacy click handling. */
  handlePillClick(key: string): GUIEditSessionPillClick {
    if (!this.options.isEnabled()) return 'ignored';
    if (this._editing) {
      if (this._editing.key === key) {
        this.cancel();
        return 'cancelled';
      }
      // Another pill mid-edit: drop the session, only select the new pill.
      this.cancel();
      this._selectedKey = key;
      this.notify();
      return 'selected';
    }
    if (this._selectedKey === key) return 'selected';
    this._selectedKey = key;
    this.notify();
    return 'selected';
  }

  /** Starts editing the selected range. False when there is nothing to edit. */
  startEdit(): boolean {
    if (!this.options.isEnabled() || this._editing) return false;
    const range = this.selectedRange;
    if (!range) return false;
    this._editing = { key: this._selectedKey as string, range };
    this.announce(
      formatEditMessage(this.options.getMessages().started, this.options.formatLabel(range)),
    );
    this.options.loadRange(range);
    this.notify();
    return true;
  }

  /**
   * Ends the session without committing. The selection is kept. `silent`
   * skips the announcement (external value changes), `keepCompose` leaves the
   * compose surface alone (pill removal already reshapes it).
   */
  cancel(opts: { silent?: boolean; keepCompose?: boolean } = {}): void {
    if (!this._editing) return;
    const original = this._editing.range;
    this._editing = null;
    if (!opts.keepCompose) this.options.clearCompose();
    if (!opts.silent) {
      this.announce(
        formatEditMessage(this.options.getMessages().cancelled, this.options.formatLabel(original)),
      );
    }
    this.notify();
  }

  /**
   * Ends the session after the host applied the committed replacement to its
   * value. Selects and focuses the resulting pill — located by containment,
   * since the committed range may have merged into a neighbor. `focus: false`
   * keeps focus where it is (a focus-leave commit must not steal it back).
   */
  completed(committedStartISO: string, opts: { focus?: boolean } = {}): void {
    if (!this._editing) return;
    this._editing = null;
    const sorted = sortRangesByStart(this.options.getRanges(), this.options.compareStarts);
    const index = indexOfRangeContaining(sorted, committedStartISO, this.options.compareStarts);
    const result = index >= 0 ? sorted[index] : undefined;
    this._selectedKey = result ? rangeKey(result) : null;
    if (result) {
      this.announce(
        formatEditMessage(this.options.getMessages().committed, this.options.formatLabel(result)),
      );
    }
    this.notify();
    if (index >= 0 && opts.focus !== false) this.focusPill(index);
  }

  /**
   * Drops the selection silently — no announcement, no focus move. The
   * selection is a transient affordance, so it clears when the user leaves
   * the widget ({@link handleFocusLeave}); keyboard navigation between pills
   * instead moves it along via {@link handlePillClick}.
   */
  clearSelection(): void {
    if (!this._selectedKey) return;
    this._selectedKey = null;
    this.notify();
  }

  /**
   * Focus left the widget: the selection clears, hiding the pill actions. The
   * host settles any open session first.
   */
  handleFocusLeave(): void {
    this.clearSelection();
  }

  /** The ranges a commit merges against: the value minus the range being edited. */
  baseRanges(all: readonly R[] | undefined): R[] {
    return this._editing ? excludeRangeByKey(all, this._editing.key) : [...(all ?? [])];
  }

  /**
   * Escape layering below any open popup (which consume Escape themselves):
   * first cancels an open session, then clears the selection.
   */
  handleEscape(event: KeyboardEvent): boolean {
    if (event.key !== 'Escape') return false;
    if (this._editing) {
      event.preventDefault();
      event.stopPropagation();
      this.cancel();
      this.focusSelectedPill();
      return true;
    }
    if (this._selectedKey) {
      event.preventDefault();
      event.stopPropagation();
      this._selectedKey = null;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Drops a session or selection whose range no longer exists in the value
   * (pill removed, value replaced from outside). Call from `willUpdate`.
   */
  reconcileValue(all: readonly R[] | undefined): void {
    const list = all ?? [];
    if (this._editing && !findRangeByKey(list, this._editing.key)) {
      this.cancel({ silent: true });
    }
    if (this._selectedKey && !findRangeByKey(list, this._selectedKey)) {
      this._selectedKey = null;
      this.notify();
    }
  }

  /** Moves focus to the selected pill (Escape-cancel choreography). */
  focusSelectedPill(): void {
    if (!this._selectedKey) return;
    const sorted = sortRangesByStart(this.options.getRanges(), this.options.compareStarts);
    const index = sorted.findIndex((range) => rangeKey(range) === this._selectedKey);
    if (index >= 0) this.focusPill(index);
  }

  private focusPill(index: number): void {
    // Fire-and-forget with void promise.then()
    void this.host.updateComplete.then(() => this.options.getPills()?.focusPillAt(index));
  }

  private announce(text: string): void {
    this._announcement = text;
  }

  private notify(): void {
    this.options.onStateChanged();
    this.host.requestUpdate();
  }
}
