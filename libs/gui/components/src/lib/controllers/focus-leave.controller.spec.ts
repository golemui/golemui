// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { GUIFocusLeaveController, type GUIFocusLeaveHost } from './focus-leave.controller';

/**
 * Characterization tests for the focus-leave logic extracted from the six
 * picker components and abstract-calendar. jsdom has no requestAnimationFrame,
 * so a manual queue stands in for it and is flushed explicitly.
 */

let rafQueue: Map<number, FrameRequestCallback>;
let nextRafId: number;

function flushRaf() {
  const callbacks = [...rafQueue.values()];
  rafQueue.clear();
  callbacks.forEach((cb) => cb(0));
}

function createHost() {
  const controllers: ReactiveController[] = [];
  const el = document.createElement('div') as unknown as GUIFocusLeaveHost;
  Object.assign(el, {
    addController: (c: ReactiveController) => controllers.push(c),
    removeController: (c: ReactiveController) => {
      const index = controllers.indexOf(c);
      if (index > -1) controllers.splice(index, 1);
    },
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  } satisfies Partial<ReactiveControllerHost>);
  document.body.appendChild(el);
  return {
    host: el,
    connect: () => controllers.forEach((c) => c.hostConnected?.()),
    disconnect: () => controllers.forEach((c) => c.hostDisconnected?.()),
  };
}

function focusOutEvent(relatedTarget: Element | null): FocusEvent {
  return new FocusEvent('focusout', {
    bubbles: true,
    composed: true,
    relatedTarget: relatedTarget ?? undefined,
  });
}

describe('GUIFocusLeaveController', () => {
  beforeEach(() => {
    rafQueue = new Map();
    nextRafId = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        nextRafId += 1;
        rafQueue.set(nextRafId, cb);
        return nextRafId;
      }),
    );
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => {
        rafQueue.delete(id);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('registers itself on the host', () => {
    const { host } = createHost();
    const addController = vi.spyOn(host, 'addController');
    const ctrl = new GUIFocusLeaveController(host, { onLeave: vi.fn() });
    expect(addController).toHaveBeenCalledWith(ctrl);
  });

  it('calls onLeave after the rAF when focus moved outside', () => {
    const { host, connect } = createHost();
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave });
    connect();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    host.dispatchEvent(focusOutEvent(outside));

    expect(onLeave).not.toHaveBeenCalled(); // deferred, not synchronous
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('treats a null relatedTarget as outside', () => {
    const { host, connect } = createHost();
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave });
    connect();

    host.dispatchEvent(focusOutEvent(null));
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the relatedTarget is inside the host', () => {
    const { host, connect } = createHost();
    const inner = document.createElement('input');
    host.appendChild(inner);
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave });
    connect();

    host.dispatchEvent(focusOutEvent(inner));

    expect(rafQueue.size).toBe(0); // no deferral even scheduled
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('does not call onLeave when focus is back inside by the time the rAF fires', () => {
    const { host, connect } = createHost();
    const inner = document.createElement('input');
    host.appendChild(inner);
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave });
    connect();

    host.dispatchEvent(focusOutEvent(null));
    inner.focus(); // focus returns inside before the frame
    expect(document.activeElement).toBe(inner);

    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('cancels the pending rAF when a second focusout arrives, leaving one deferral', () => {
    const { host, connect } = createHost();
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave });
    connect();

    host.dispatchEvent(focusOutEvent(null));
    host.dispatchEvent(focusOutEvent(null));

    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(rafQueue.size).toBe(1);
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("defer 'immediate' calls onLeave synchronously without any rAF", () => {
    const { host, connect } = createHost();
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave, defer: 'immediate' });
    connect();

    host.dispatchEvent(focusOutEvent(null));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("defer 'immediate' still respects the relatedTarget containment check", () => {
    const { host, connect } = createHost();
    const inner = document.createElement('input');
    host.appendChild(inner);
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave, defer: 'immediate' });
    connect();

    host.dispatchEvent(focusOutEvent(inner));
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('uses a custom isInside for both the relatedTarget and activeElement checks', () => {
    const { host, connect } = createHost();
    const sibling = document.createElement('div');
    document.body.appendChild(sibling);
    const onLeave = vi.fn();
    const isInside = vi.fn((el: Element | null) => !!el && (host.contains(el) || sibling.contains(el)));
    new GUIFocusLeaveController(host, { onLeave, isInside });
    connect();

    // relatedTarget outside the host but accepted by the custom predicate.
    host.dispatchEvent(focusOutEvent(sibling));
    expect(isInside).toHaveBeenCalledWith(sibling);
    expect(rafQueue.size).toBe(0);
    expect(onLeave).not.toHaveBeenCalled();

    // relatedTarget rejected -> deferral -> activeElement re-checked through the predicate.
    host.dispatchEvent(focusOutEvent(null));
    flushRaf();
    expect(isInside).toHaveBeenCalledWith(document.activeElement);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("attach 'manual' does not listen on the host but exposes a bindable onFocusOut", () => {
    const { host, connect } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave, attach: 'manual' });
    connect();

    host.dispatchEvent(focusOutEvent(null));
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();

    // Detached-callable, as a template binding would invoke it.
    const { onFocusOut } = ctrl;
    onFocusOut(focusOutEvent(null));
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('hostDisconnected removes the host listener and cancels a pending rAF', () => {
    const { host, connect, disconnect } = createHost();
    const onLeave = vi.fn();
    new GUIFocusLeaveController(host, { onLeave });
    connect();

    host.dispatchEvent(focusOutEvent(null));
    expect(rafQueue.size).toBe(1);

    disconnect();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(rafQueue.size).toBe(0);
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();

    // Listener is gone: further focusout events are ignored entirely.
    host.dispatchEvent(focusOutEvent(null));
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('cancelPendingLeave drops a scheduled deferral', () => {
    const { host, connect } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });
    connect();

    host.dispatchEvent(focusOutEvent(null));
    ctrl.cancelPendingLeave();
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });
});
