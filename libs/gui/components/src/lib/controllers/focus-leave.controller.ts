import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export type GUIFocusLeaveHost = ReactiveControllerHost & HTMLElement;

export interface GUIFocusLeaveControllerOptions {
  /** Called when focus has effectively left the watched subtree. */
  onLeave(): void;
}

// TODO: Improve this? maybe with a data-focusable attribute?
/** Elements that take focus when clicked, so clicking them is never a leave. */
const FOCUSABLE_SELECTOR =
  'input, button, select, textarea, a[href], [tabindex], [contenteditable]';

/**
 * Detects "focus left the widget" with the exact semantics duplicated across
 * the six picker components, and distinguishes it from the focus losses a
 * widget inflicts on itself: clicking chrome that cannot hold focus, or
 * re-rendering the focused element away. Both send focus to the document
 * body while the user is still working inside the widget, and reporting
 * either as a leave would validate a half-finished entry.
 */
export class GUIFocusLeaveController implements ReactiveController {
  private host: GUIFocusLeaveHost;
  private options: GUIFocusLeaveControllerOptions;
  private _rafId: number | undefined;
  /** Whether the pointer interaction currently settling started inside the host. */
  private _pointerInside = false;

  constructor(host: GUIFocusLeaveHost, options: GUIFocusLeaveControllerOptions) {
    host.addController(this);
    this.host = host;
    this.options = options;
  }

  hostConnected() {
    this.host.addEventListener('mousedown', this.onHostMouseDown);
    document.addEventListener('mousedown', this.onDocumentMouseDown, true);
  }

  /**
   * Keeps focus inside the widget when a click lands on chrome that cannot
   * hold focus — a group wrapper, padding, a label. The browser would
   * otherwise move focus to the document body, which is indistinguishable
   * from the user genuinely leaving the widget.
   */
  private onHostMouseDown = (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target) return;

    const focusable = target.closest(FOCUSABLE_SELECTOR);
    if (focusable && this.host.contains(focusable)) return;

    event.preventDefault();
  };

  /** Remembers whether the interaction being settled started inside the host. */
  private onDocumentMouseDown = (event: MouseEvent) => {
    this._pointerInside = this.isInside(event.target as Element | null);
  };

  /** Template-bindable focusout handler (arrow fn so `this` stays bound). */
  onFocusOut = (event: FocusEvent) => {
    this.handleFocusOut(event);
  };

  /** Runs the leave detection for a focusout event. */
  handleFocusOut(event: FocusEvent) {
    if (this.isInside(event.relatedTarget as Element | null)) {
      return;
    }

    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = requestAnimationFrame(() => {
      this._rafId = undefined;
      const active = document.activeElement;
      if (this.isInside(active)) return;

      // The user is still working in the widget, so this is not a leave.
      if (this._pointerInside && (!active || active === document.body)) return;

      this.options.onLeave();
    });
  }

  /** Cancels a pending deferred leave check, if any. */
  private cancelPendingLeave() {
    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
  }

  private isInside(el: Element | null): boolean {
    return !!el && this.host.contains(el);
  }

  hostDisconnected() {
    this.host.removeEventListener('mousedown', this.onHostMouseDown);
    document.removeEventListener('mousedown', this.onDocumentMouseDown, true);
    this.cancelPendingLeave();
  }
}
