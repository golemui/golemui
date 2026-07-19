// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { GUIFocusLeaveController, type GUIFocusLeaveHost } from './focus-leave.controller';

/**
 * Characterization tests for the focus-leave logic extracted from the six
 * picker components and abstract-calendar. jsdom has no requestAnimationFrame,
 * so a manual queue stands in for it and is flushed explicitly.
 *
 * The owner drives focusout into the controller (the pickers forward from their
 * own host listener; the calendars bind `@focusout=${ctrl.onFocusOut}`), so the
 * tests call `handleFocusOut`/`onFocusOut` directly, exactly as those bindings do.
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
    const { host } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    ctrl.handleFocusOut(focusOutEvent(outside));

    expect(onLeave).not.toHaveBeenCalled(); // deferred, not synchronous
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('treats a null relatedTarget as outside', () => {
    const { host } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    ctrl.handleFocusOut(focusOutEvent(null));
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the relatedTarget is inside the host', () => {
    const { host } = createHost();
    const inner = document.createElement('input');
    host.appendChild(inner);
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    ctrl.handleFocusOut(focusOutEvent(inner));

    expect(rafQueue.size).toBe(0); // no deferral even scheduled
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('does not call onLeave when focus is back inside by the time the rAF fires', () => {
    const { host } = createHost();
    const inner = document.createElement('input');
    host.appendChild(inner);
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    ctrl.handleFocusOut(focusOutEvent(null));
    inner.focus(); // focus returns inside before the frame
    expect(document.activeElement).toBe(inner);

    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('cancels the pending rAF when a second focusout arrives, leaving one deferral', () => {
    const { host } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    ctrl.handleFocusOut(focusOutEvent(null));
    ctrl.handleFocusOut(focusOutEvent(null));

    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(rafQueue.size).toBe(1);
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('exposes onFocusOut as a detached-callable template binding', () => {
    const { host } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    // Destructured as `@focusout=${ctrl.onFocusOut}` would invoke it.
    const { onFocusOut } = ctrl;
    onFocusOut(focusOutEvent(null));
    flushRaf();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('hostDisconnected cancels a pending rAF so a queued leave never fires', () => {
    const { host, disconnect } = createHost();
    const onLeave = vi.fn();
    const ctrl = new GUIFocusLeaveController(host, { onLeave });

    ctrl.handleFocusOut(focusOutEvent(null));
    expect(rafQueue.size).toBe(1);

    disconnect();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(rafQueue.size).toBe(0);
    flushRaf();
    expect(onLeave).not.toHaveBeenCalled();
  });
});
