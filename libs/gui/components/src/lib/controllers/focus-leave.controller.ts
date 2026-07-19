import { type ReactiveController, type ReactiveControllerHost } from 'lit';

export type GUIFocusLeaveHost = ReactiveControllerHost & HTMLElement;

export interface GUIFocusLeaveControllerOptions {
  /** Called when focus has effectively left the watched subtree. */
  onLeave(): void;
}

/**
 * Detects "focus left the widget" with the exact semantics duplicated across
 * the six picker components:
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
    this.cancelPendingLeave();
  }
}
