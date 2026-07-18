import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export type GUIFocusLeaveHost = ReactiveControllerHost & HTMLElement;

export interface GUIFocusLeaveControllerOptions {
  /** Called when focus has effectively left the watched subtree. */
  onLeave(): void;
  /**
   * Containment test applied to both the focusout `relatedTarget` and the
   * deferred `document.activeElement` re-check. Defaults to
   * `(el) => !!el && host.contains(el)`, which is what the pickers and
   * calendars use today (light DOM, so `contains` sees the whole widget).
   */
  isInside?(el: Element | null): boolean;
  /**
   * How to react once the focusout target is outside:
   * - 'raf' (default): defer via requestAnimationFrame — storing the rAF id,
   *   cancelling any pending one, and re-checking `document.activeElement`
   *   containment before calling `onLeave`. This is the behavior of the
   *   date/date-time/range pickers and the calendars.
   * - 'immediate': call `onLeave` synchronously, with no re-check. This is
   *   the behavior of time-picker, whose focusout close has no rAF deferral.
   */
  defer?: 'raf' | 'immediate';
  /**
   * - 'host' (default): attach a `focusout` listener on the host element in
   *   hostConnected and remove it in hostDisconnected — how the pickers wire
   *   focusout today via connectedCallback.
   * - 'manual': attach nothing; the owner binds `onFocusOut` in a template
   *   (`@focusout=${ctrl.onFocusOut}`, like abstract-calendar's wrapper div)
   *   or forwards events to `handleFocusOut` itself.
   */
  attach?: 'host' | 'manual';
}

/**
 * Detects "focus left the widget" with the exact semantics duplicated across
 * the six picker components and abstract-calendar:
 *
 * 1. If the focusout `relatedTarget` is still inside, do nothing.
 * 2. Otherwise defer one animation frame (cancelling any pending deferral)
 *    and re-check `document.activeElement`; only call `onLeave` if focus is
 *    really outside by then. The deferral absorbs transient focus moves
 *    (e.g. month navigation re-rendering buttons).
 * 3. A pending deferral is cancelled on hostDisconnected.
 */
export class GUIFocusLeaveController implements ReactiveController {
  private host: GUIFocusLeaveHost;
  private options: GUIFocusLeaveControllerOptions;
  private _rafId: number | undefined;

  constructor(host: GUIFocusLeaveHost, options: GUIFocusLeaveControllerOptions) {
    host.addController(this);
    this.host = host;
    this.options = options;
  }

  /** Template-bindable focusout handler (arrow fn so `this` stays bound). */
  onFocusOut = (event: FocusEvent) => {
    this.handleFocusOut(event);
  };

  /** Runs the leave detection for a focusout event. */
  handleFocusOut(event: FocusEvent) {
    if (this.isInside(event.relatedTarget as Element | null)) {
      return;
    }

    if (this.options.defer === 'immediate') {
      this.options.onLeave();
      return;
    }

    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = requestAnimationFrame(() => {
      this._rafId = undefined;
      if (!this.isInside(document.activeElement)) {
        this.options.onLeave();
      }
    });
  }

  /** Cancels a pending deferred leave check, if any. */
  cancelPendingLeave() {
    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
  }

  private isInside(el: Element | null): boolean {
    if (this.options.isInside) {
      return this.options.isInside(el);
    }
    return !!el && this.host.contains(el);
  }

  hostConnected() {
    if ((this.options.attach ?? 'host') === 'host') {
      this.host.addEventListener('focusout', this.onFocusOut);
    }
  }

  hostDisconnected() {
    if ((this.options.attach ?? 'host') === 'host') {
      this.host.removeEventListener('focusout', this.onFocusOut);
    }
    this.cancelPendingLeave();
  }
}
