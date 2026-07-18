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
   * Elements whose composedPath containment counts as an "inside" click for
   * the document-level outside-click close (the input ref and the popup ref
   * in the pickers). Null/undefined entries are skipped, matching the
   * `ref && path.includes(ref)` checks in the components.
   */
  getInteriorElements(): (Element | null | undefined)[];
  /**
   * Selector (scoped to the host, light DOM) for the element to focus when
   * Escape closes the popup, e.g. `'gui-date input'`.
   */
  focusRestoreSelector: string;
  isDisabled(): boolean;
  /** Classifies a click on the anchor. See {@link GUIPopupClickIntent}. */
  clickIntent(target: HTMLElement): GUIPopupClickIntent;
  /**
   * How Enter/Space (keyup) and a 'toggle' click intent flip the popup:
   * - 'toggle': flip the open state directly, bypassing the show() guards —
   *   the scalar date/date-time pickers' `_isOpen = !_isOpen`, which ignores
   *   the restoring-focus guard and skips `beforeOpen`.
   * - 'openClose': `close()` when open, `show()` when closed — the
   *   time-picker and range pickers' guarded open/close methods.
   *
   * The two paths correlate in every picker (direct flips for scalars,
   * guarded open/close for time/range), so one option governs both.
   */
  keyToggleMode: 'toggle' | 'openClose';
  /**
   * Focusout close policy: 'deferred' (default) uses the rAF deferral with
   * an activeElement re-check; 'immediate' closes synchronously (time-picker
   * has no rAF in its focusout close).
   */
  focusOutClose?: 'deferred' | 'immediate';
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
 * Overlay shell shared by the six picker components. Reproduces their exact
 * micro-semantics:
 *
 * - Document 'click' listener (bubble phase, added in hostConnected) closes
 *   the popup when the composedPath contains none of the interior elements.
 * - 'focusout' listener on the host closes the popup when focus leaves the
 *   host subtree, via {@link GUIFocusLeaveController} (rAF deferral with a
 *   stored id, cancelled on disconnect — or an immediate close). The
 *   suppress-one-focusout flag is consumed BEFORE the open check, exactly
 *   like the range pickers' `_ignoreNextFocusOut`.
 * - Enter/Space toggling happens on keyup, only when the event target is the
 *   anchor itself; Escape is handled on keydown with preventDefault +
 *   stopPropagation (so it never reaches the document while open), restores
 *   focus to `focusRestoreSelector`, then closes.
 * - Restoring focus arms a `_restoringFocus` flag, reset via setTimeout(0),
 *   which blocks the focus-triggered show() from re-opening the popup.
 */
export class GUIPopupController implements ReactiveController {
  private host: GUIPopupHost;
  private options: GUIPopupControllerOptions;
  private focusLeave: GUIFocusLeaveController;

  private _open = false;
  private _restoringFocus = false;
  private _suppressNextFocusOut = false;

  constructor(host: GUIPopupHost, options: GUIPopupControllerOptions) {
    this.host = host;
    this.options = options;
    this.focusLeave = new GUIFocusLeaveController(host, {
      attach: 'manual',
      defer: options.focusOutClose === 'immediate' ? 'immediate' : 'raf',
      onLeave: () => this.close(),
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
   * Arrow fn so it can be template-bound directly (e.g. `@focus=${ctrl.show}`).
   */
  show = () => {
    if (this.options.isDisabled() || this._restoringFocus) return;
    this.options.beforeOpen?.(this);
    this.setOpen(true);
  };

  /** Guarded close: only an actual open→closed transition has effects. */
  close = () => {
    this.setOpen(false);
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

  /** Template-bindable anchor click handler (`@click=${ctrl.onAnchorClick}`). */
  onAnchorClick = (event: Event) => {
    if (this.options.isDisabled()) return;
    const target = event.target as HTMLElement;

    const intent = this.options.clickIntent(target);
    if (intent === 'ignore') return;
    if (intent === 'open') {
      this.show();
      return;
    }
    this.toggle();
  };

  /**
   * Template-bindable anchor keyup handler. Enter/Space toggle the popup,
   * but only when the event target IS the anchor the handler is bound to.
   */
  onAnchorKeyUp = (event: KeyboardEvent) => {
    if (this.options.isDisabled()) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      this.toggle();
    }
  };

  /**
   * Template-bindable anchor keydown handler. Escape while open prevents
   * default, stops propagation (a characterization test asserts Escape must
   * NOT reach the document while open, and MUST when closed), restores focus
   * to the input, then closes.
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

    const path = event.composedPath();
    const clickedInside = this.options
      .getInteriorElements()
      .some((el) => !!el && path.includes(el));

    if (!clickedInside) {
      this.close();
    }
  };

  private onHostFocusOut = (event: FocusEvent) => {
    if (this._suppressNextFocusOut) {
      this._suppressNextFocusOut = false;
      return;
    }
    if (!this._open) return;
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
   * re-open the popup through show(). Public because time-picker also
   * restores focus after a list pick, outside the Escape path.
   */
  restoreFocusToInput() {
    const part = this.host.querySelector<HTMLElement>(this.options.focusRestoreSelector);
    if (!part) return;
    this._restoringFocus = true;
    part.focus();
    setTimeout(() => {
      this._restoringFocus = false;
    });
  }

  hostConnected() {
    document.addEventListener('click', this.onDocumentClick);
    this.host.addEventListener('focusout', this.onHostFocusOut);
  }

  hostDisconnected() {
    document.removeEventListener('click', this.onDocumentClick);
    this.host.removeEventListener('focusout', this.onHostFocusOut);
    // The composed GUIFocusLeaveController cancels its own pending rAF in its
    // hostDisconnected (it is registered on the same host).
  }
}
