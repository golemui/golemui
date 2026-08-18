import { type ReactiveController } from 'lit';
import { GUIFocusLeaveController, type GUIFocusLeaveHost } from './focus-leave.controller';

export type GUIPopupHost = GUIFocusLeaveHost;

/**
 * What a click on the anchor (the wrapper div) should do, derived from the
 * click target:
 * - 'open': force the popup open (input parts / popup interior clicks).
 * - 'toggle': flip the popup (chrome such as the arrow button).
 * - 'ignore': leave the popup state alone (e.g. a day button click, whose
 *   own change handler decides whether to close).
 */
export type GUIPopupClickIntent = 'open' | 'toggle' | 'ignore';

export interface GUIPopupControllerOptions {
  /**
   * Selector (scoped to the host, light DOM) for the element to focus when
   * Escape closes the popup, e.g. `'gui-date input'`. Hosts that delegate
   * focus restoration to their own host (gui-pills' `pillexit`) omit it,
   * making `restoreFocusToInput()` a no-op.
   */
  focusRestoreSelector?: string;
  focusPopupSelector?: string;
  isDisabled(): boolean;
  /** Classifies a click on the anchor. See {@link GUIPopupClickIntent}. */
  clickIntent(target: HTMLElement): GUIPopupClickIntent;
  /**
   * How Enter/Space (keyup) and a 'toggle' click intent flip the popup:
   * - 'toggle': flip the open state directly, bypassing the show() guards,
   *   which ignores the restoring-focus guard and skips `beforeOpen`.
   * - 'openClose': `close()` when open, `show()` when closed, the
   *   time-picker and range pickers' guarded open/close methods.
   *
   * The two paths correlate in every picker (direct flips for scalars,
   * guarded open/close for time/range), so one option governs both.
   */
  keyToggleMode: 'toggle' | 'openClose';
  /**
   * Runs at the start of every guarded show() — even when the popup is
   * already open, matching the range pickers' openCalendar, which always
   * performs the pills-dropdown coordination. Use with
   * `suppressNextFocusOut()` to swallow the focus churn of closing a
   * coexisting dropdown.
   */
  beforeOpen?(controller: GUIPopupController): void;
  /** Fired after every actual open-state change (not on redundant calls). */
  onOpenChanged?(open: boolean): void;
}

/**
 * Overlay shell shared by the six picker components.
 *
 * - Document 'click' listener (bubble phase) closes the popup when neither
 *   the click path nor the gesture origin is inside the host.
 * - 'focusout' of the host subtree closes unless caused by an interior
 *   gesture; keydown (Tab/Escape) re-arms normal behavior first.
 * - Enter/Space toggling is native: each picker's toggle is a real button.
 * - Escape is handled on keydown with preventDefault + stopPropagation
 *   (so it never reaches the document while open), restores focus to
 *   `focusRestoreSelector`, then closes.
 */
export class GUIPopupController implements ReactiveController {
  private host: GUIPopupHost;
  private options: GUIPopupControllerOptions;
  private focusLeave: GUIFocusLeaveController;

  private _open = false;
  private _restoringFocus = false;
  private _suppressNextFocusOut = false;
  private _pointerDownInside = false;
  private _pointerDownTarget: HTMLElement | null = null;

  constructor(host: GUIPopupHost, options: GUIPopupControllerOptions) {
    this.host = host;
    this.options = options;
    this.focusLeave = new GUIFocusLeaveController(host, {
      onLeave: () => {
        this.close();
      },
    });
    host.addController(this);
  }

  get open(): boolean {
    return this._open;
  }

  /**
   * Guarded open: no-ops while disabled or while focus is being restored
   * after Escape. Always runs `beforeOpen` (even when already open); only an
   * actual closed→open transition fires `onOpenChanged`/requestUpdate.
   */
  show = () => {
    if (this.options.isDisabled() || this._restoringFocus) return;
    this.options.beforeOpen?.(this);
    this.setOpen(true);
  };

  close = () => {
    this.setOpen(false);
  };

  openAndFocus = () => {
    this.show();
    if (!this._open || !this.options.focusPopupSelector) return;
    Promise.resolve(this.host.updateComplete).then(() => {
      this.host.querySelector<HTMLElement>(this.options.focusPopupSelector as string)?.focus();
    });
  };

  /** Flips the popup according to `keyToggleMode` (see the option docs). */
  toggle = () => {
    if (this.options.isDisabled()) return;
    if (this.options.keyToggleMode === 'toggle') {
      this.setOpen(!this._open);
    } else if (this._open) {
      this.close();
    } else {
      this.show();
    }
  };

  /**
   * Swallows exactly the next focusout pass — even one that arrives while
   * the popup is closed — then re-arms normal behavior. Used around
   * operations that transiently move focus (pills dropdown coordination).
   */
  suppressNextFocusOut() {
    this._suppressNextFocusOut = true;
  }

  /**
   * Template-bindable anchor click handler (`@click=${ctrl.onAnchorClick}`).
   */
  onAnchorClick = (event: Event) => {
    if (this.options.isDisabled()) return;
    const target = (this._pointerDownTarget ?? event.target) as HTMLElement;

    const intent = this.options.clickIntent(target);
    if (intent === 'ignore') return;
    if (intent === 'open') {
      this.show();
      return;
    }
    this.toggle();
  };

  /**
   * Template-bindable anchor keydown handler. Escape while open prevents
   * default, stops propagation, restores focus to the input, then closes.
   *
   * @returns true when it consumed the event (Escape while open), so hosts
   *   with extra keydown behavior (time-picker's arrow stepping / Enter
   *   commit) can bail out exactly where the monolithic handler returned.
   */
  onAnchorKeyDown = (event: KeyboardEvent): boolean => {
    if (this.options.isDisabled()) return false;
    if (event.key === 'Escape' && this._open) {
      event.preventDefault();
      event.stopPropagation();
      this.restoreFocusToInput();
      this.close();
      return true;
    }
    return false;
  };

  private onDocumentClick = (event: MouseEvent) => {
    if (!this._open) return;

    const clickedInside = event.composedPath().includes(this.host);

    if (!clickedInside && !this._pointerDownInside) {
      this.close();
    }
  };

  private onDocumentPointerDown = (event: Event) => {
    const path = event.composedPath();
    this._pointerDownInside = path.includes(this.host);
    this._pointerDownTarget = (path[0] as HTMLElement) ?? null;
  };

  private onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' && event.key !== 'Escape') return;
    this._pointerDownInside = false;
    this._pointerDownTarget = null;
  };

  /**
   * Close driven by the popup content's own focus-leave detection (the
   * pickers' `@blur` on the calendar). Ignored while the latest pointer
   * interaction started inside — its focus churn is not a real departure.
   */
  closeOnFocusLeave = () => {
    if (this._pointerDownInside) return;
    this.close();
  };

  private onHostFocusOut = (event: FocusEvent) => {
    if (this._suppressNextFocusOut) {
      this._suppressNextFocusOut = false;
      return;
    }
    if (!this._open) return;
    const related = event.relatedTarget as Node | null;
    if (this._pointerDownInside && (!related || related.contains(this.host))) return;
    this.focusLeave.handleFocusOut(event);
  };

  private setOpen(open: boolean) {
    if (this._open === open) return;
    this._open = open;
    this.host.requestUpdate();
    this.options.onOpenChanged?.(open);
  }

  /**
   * Focuses the `focusRestoreSelector` element, arming the restoring-focus
   * flag (reset via setTimeout(0)) so the resulting focus event does not
   * re-open the popup through show().
   */
  restoreFocusToInput() {
    if (!this.options.focusRestoreSelector) return;
    const part = this.host.querySelector<HTMLElement>(this.options.focusRestoreSelector);
    if (!part) return;
    this._restoringFocus = true;
    part.focus();
    setTimeout(() => {
      this._restoringFocus = false;
    });
  }

  hostUpdated() {
    if (this._open && this.options.isDisabled()) {
      this.close();
    }
  }

  hostConnected() {
    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.addEventListener('keydown', this.onDocumentKeyDown, true);
    this.host.addEventListener('focusout', this.onHostFocusOut);
  }

  hostDisconnected() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    document.removeEventListener('keydown', this.onDocumentKeyDown, true);
    this.host.removeEventListener('focusout', this.onHostFocusOut);
  }
}
