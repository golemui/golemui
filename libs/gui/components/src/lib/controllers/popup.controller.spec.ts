// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import {
  GUIPopupController,
  type GUIPopupControllerOptions,
  type GUIPopupHost,
} from './popup.controller';

/**
 * Characterization tests for the overlay shell extracted from the six picker
 * components. jsdom has no requestAnimationFrame, so a manual queue stands in
 * for it and is flushed explicitly.
 */

let rafQueue: Map<number, FrameRequestCallback>;
let nextRafId: number;
let cleanups: Array<() => void>;

function flushRaf() {
  const callbacks = [...rafQueue.values()];
  rafQueue.clear();
  callbacks.forEach((cb) => cb(0));
}

/** Lets the controller's setTimeout(0) reset of the restoring-focus flag run. */
function flushTimeout(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

function createHost() {
  const controllers: ReactiveController[] = [];
  const el = document.createElement('div') as unknown as GUIPopupHost;
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

/**
 * Builds a host mimicking a picker's light DOM: an anchor wrapper containing
 * a focusable input (the focus-restore target) and an interior element
 * standing in for the popup panel.
 */
function setup(overrides: Partial<GUIPopupControllerOptions> = {}) {
  const { host, connect, disconnect } = createHost();
  cleanups.push(disconnect);

  const anchor = document.createElement('div');
  const input = document.createElement('input');
  input.className = 'restore-target';
  const interior = document.createElement('div');
  anchor.appendChild(input);
  anchor.appendChild(interior);
  host.appendChild(anchor);

  const onOpenChanged = vi.fn();
  const options: GUIPopupControllerOptions = {
    getInteriorElements: () => [input, interior],
    focusRestoreSelector: 'input.restore-target',
    isDisabled: () => false,
    clickIntent: () => 'toggle',
    keyToggleMode: 'openClose',
    onOpenChanged,
    ...overrides,
  };
  const ctrl = new GUIPopupController(host, options);
  connect();

  return { host, anchor, input, interior, ctrl, onOpenChanged, connect, disconnect };
}

function outsideClick() {
  document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function focusOutEvent(relatedTarget: Element | null): FocusEvent {
  return new FocusEvent('focusout', {
    bubbles: true,
    composed: true,
    relatedTarget: relatedTarget ?? undefined,
  });
}

function escapeEvent(): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
}

describe('GUIPopupController', () => {
  beforeEach(() => {
    cleanups = [];
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
    // Detach document-level listeners left by tests before the next one runs.
    cleanups.forEach((cleanup) => cleanup());
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  describe('open state', () => {
    it('show()/close() flip open, request a host update and notify onOpenChanged', () => {
      const { host, ctrl, onOpenChanged } = setup();

      expect(ctrl.open).toBe(false);
      ctrl.show();
      expect(ctrl.open).toBe(true);
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
      expect(onOpenChanged).toHaveBeenNthCalledWith(1, true);

      ctrl.close();
      expect(ctrl.open).toBe(false);
      expect(host.requestUpdate).toHaveBeenCalledTimes(2);
      expect(onOpenChanged).toHaveBeenNthCalledWith(2, false);
    });

    it('redundant show()/close() calls do not re-notify (time-picker never re-emits listtoggle)', () => {
      const { ctrl, onOpenChanged } = setup();

      ctrl.close(); // already closed
      expect(onOpenChanged).not.toHaveBeenCalled();

      ctrl.show();
      ctrl.show(); // already open
      expect(onOpenChanged).toHaveBeenCalledTimes(1);
    });

    it('isDisabled true blocks opening', () => {
      const { ctrl, onOpenChanged } = setup({ isDisabled: () => true });

      ctrl.show();
      ctrl.toggle();
      expect(ctrl.open).toBe(false);
      expect(onOpenChanged).not.toHaveBeenCalled();
    });

    it('beforeOpen fires before the open state changes, on every show() like the range pickers', () => {
      const openStatesSeen: boolean[] = [];
      const calls: string[] = [];
      const beforeOpen = vi.fn((ctrl: GUIPopupController) => {
        openStatesSeen.push(ctrl.open);
        calls.push('beforeOpen');
      });
      const { ctrl, onOpenChanged } = setup({ beforeOpen });
      onOpenChanged.mockImplementation(() => calls.push('onOpenChanged'));

      ctrl.show();
      expect(openStatesSeen).toEqual([false]);
      expect(calls).toEqual(['beforeOpen', 'onOpenChanged']);

      // openCalendar in the range pickers runs the dropdown coordination even
      // when the calendar is already open.
      ctrl.show();
      expect(beforeOpen).toHaveBeenCalledTimes(2);
      expect(onOpenChanged).toHaveBeenCalledTimes(1);
    });
  });

  describe('outside click', () => {
    it('a document click outside the interior elements closes the popup', () => {
      const { ctrl } = setup();
      ctrl.show();

      outsideClick();
      expect(ctrl.open).toBe(false);
    });

    it('a click inside an interior element does not close the popup', () => {
      const { ctrl, interior } = setup();
      ctrl.show();

      interior.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(ctrl.open).toBe(true);
    });

    it('skips null/undefined interior entries like the optional refs in the pickers', () => {
      const { ctrl, interior } = setup({ getInteriorElements: () => [null, undefined, interior] });
      ctrl.show();

      interior.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(ctrl.open).toBe(true);

      outsideClick();
      expect(ctrl.open).toBe(false);
    });

    it('does nothing while closed', () => {
      const { ctrl, onOpenChanged } = setup();

      outsideClick();
      expect(ctrl.open).toBe(false);
      expect(onOpenChanged).not.toHaveBeenCalled();
    });
  });

  describe('focusout', () => {
    it('focusout to an outside element closes after the rAF', () => {
      const { host, ctrl } = setup();
      ctrl.show();

      const outside = document.createElement('button');
      document.body.appendChild(outside);
      host.dispatchEvent(focusOutEvent(outside));

      expect(ctrl.open).toBe(true); // deferred
      flushRaf();
      expect(ctrl.open).toBe(false);
    });

    it('focusout to an interior element does not close', () => {
      const { host, ctrl, input } = setup();
      ctrl.show();

      host.dispatchEvent(focusOutEvent(input));
      expect(rafQueue.size).toBe(0);
      flushRaf();
      expect(ctrl.open).toBe(true);
    });

    it('does not close when focus is back inside the host by the time the rAF fires', () => {
      const { host, ctrl, input } = setup();
      ctrl.show();

      host.dispatchEvent(focusOutEvent(null));
      input.focus();
      flushRaf();
      expect(ctrl.open).toBe(true);
    });

    it("focusOutClose 'immediate' closes synchronously without a rAF (time-picker)", () => {
      const { host, ctrl } = setup({ focusOutClose: 'immediate' });
      ctrl.show();

      host.dispatchEvent(focusOutEvent(null));
      expect(ctrl.open).toBe(false);
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });

    it('suppressNextFocusOut swallows exactly one focusout, then re-arms normal behavior', () => {
      const { host, ctrl } = setup();
      ctrl.show();
      ctrl.suppressNextFocusOut();

      host.dispatchEvent(focusOutEvent(null));
      expect(rafQueue.size).toBe(0); // swallowed before any deferral
      flushRaf();
      expect(ctrl.open).toBe(true);

      host.dispatchEvent(focusOutEvent(null));
      flushRaf();
      expect(ctrl.open).toBe(false);
    });

    it('the suppression is consumed even while closed (checked before the open gate, like the range pickers)', () => {
      const { host, ctrl } = setup();
      ctrl.suppressNextFocusOut();

      host.dispatchEvent(focusOutEvent(null)); // closed, but consumes the flag
      ctrl.show();
      host.dispatchEvent(focusOutEvent(null));
      flushRaf();
      expect(ctrl.open).toBe(false); // no longer suppressed
    });
  });

  describe('Escape on keydown', () => {
    it('prevents default, stops propagation, closes and restores focus to the selector target', () => {
      const { ctrl, input } = setup();
      ctrl.show();

      const event = escapeEvent();
      const preventDefault = vi.spyOn(event, 'preventDefault');
      const stopPropagation = vi.spyOn(event, 'stopPropagation');

      const handled = ctrl.onAnchorKeyDown(event);

      expect(handled).toBe(true);
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(ctrl.open).toBe(false);
      expect(document.activeElement).toBe(input);
    });

    it('lets Escape through untouched while closed (it must reach the document)', () => {
      const { ctrl } = setup();

      const event = escapeEvent();
      const preventDefault = vi.spyOn(event, 'preventDefault');
      const stopPropagation = vi.spyOn(event, 'stopPropagation');

      const handled = ctrl.onAnchorKeyDown(event);

      expect(handled).toBe(false);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(stopPropagation).not.toHaveBeenCalled();
    });

    it('ignores non-Escape keys', () => {
      const { ctrl } = setup();
      ctrl.show();

      const handled = ctrl.onAnchorKeyDown(
        new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
      );
      expect(handled).toBe(false);
      expect(ctrl.open).toBe(true);
    });

    it('restoreFocusToInput is callable directly (time-picker list pick) and arms the guard', async () => {
      const { ctrl, input } = setup();
      ctrl.show();

      ctrl.restoreFocusToInput();
      ctrl.close();
      expect(document.activeElement).toBe(input);

      ctrl.show(); // the restore-triggered focus event must not reopen
      expect(ctrl.open).toBe(false);

      await flushTimeout();
      ctrl.show();
      expect(ctrl.open).toBe(true);
    });

    it('the restoring-focus flag blocks show() until the setTimeout(0) reset', async () => {
      const { ctrl } = setup();
      ctrl.show();
      ctrl.onAnchorKeyDown(escapeEvent());
      expect(ctrl.open).toBe(false);

      // The restore-triggered focus event would call show(); it must not reopen.
      ctrl.show();
      expect(ctrl.open).toBe(false);

      await flushTimeout();
      ctrl.show();
      expect(ctrl.open).toBe(true);
    });
  });

  describe('Enter/Space on keyup', () => {
    function keyUpOn(anchor: HTMLElement, ctrl: GUIPopupController, key: string) {
      anchor.addEventListener('keyup', ctrl.onAnchorKeyUp);
      anchor.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      anchor.removeEventListener('keyup', ctrl.onAnchorKeyUp);
    }

    it("mode 'openClose': Enter opens through show() and closes through close()", () => {
      const beforeOpen = vi.fn();
      const { ctrl, anchor } = setup({ keyToggleMode: 'openClose', beforeOpen });

      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(true);
      expect(beforeOpen).toHaveBeenCalledTimes(1); // guarded open runs beforeOpen

      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(false);
    });

    it("mode 'openClose': Space toggles as well", () => {
      const { ctrl, anchor } = setup({ keyToggleMode: 'openClose' });

      keyUpOn(anchor, ctrl, ' ');
      expect(ctrl.open).toBe(true);
      keyUpOn(anchor, ctrl, ' ');
      expect(ctrl.open).toBe(false);
    });

    it("mode 'toggle': Enter flips the state directly, skipping beforeOpen", () => {
      const beforeOpen = vi.fn();
      const { ctrl, anchor, onOpenChanged } = setup({ keyToggleMode: 'toggle', beforeOpen });

      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(true);
      expect(beforeOpen).not.toHaveBeenCalled(); // direct `_isOpen = !_isOpen` flip
      expect(onOpenChanged).toHaveBeenLastCalledWith(true);

      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(false);
      expect(onOpenChanged).toHaveBeenLastCalledWith(false);
    });

    it("mode 'toggle': the direct flip ignores the restoring-focus guard", () => {
      const { ctrl, anchor } = setup({ keyToggleMode: 'toggle' });
      ctrl.show();
      ctrl.onAnchorKeyDown(escapeEvent()); // closes and arms _restoringFocus

      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(true);
    });

    it("mode 'openClose': the guarded open respects the restoring-focus guard", () => {
      const { ctrl, anchor } = setup({ keyToggleMode: 'openClose' });
      ctrl.show();
      ctrl.onAnchorKeyDown(escapeEvent()); // closes and arms _restoringFocus

      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(false);
    });

    it('ignores keyup events whose target is not the anchor itself', () => {
      const { ctrl, anchor, input } = setup();
      anchor.addEventListener('keyup', ctrl.onAnchorKeyUp);
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      anchor.removeEventListener('keyup', ctrl.onAnchorKeyUp);
      expect(ctrl.open).toBe(false);
    });

    it('ignores other keys and does nothing while disabled', () => {
      const disabled = { value: false };
      const { ctrl, anchor } = setup({ isDisabled: () => disabled.value });

      keyUpOn(anchor, ctrl, 'a');
      expect(ctrl.open).toBe(false);

      disabled.value = true;
      keyUpOn(anchor, ctrl, 'Enter');
      expect(ctrl.open).toBe(false);
    });
  });

  describe('anchor click', () => {
    function clickOn(target: HTMLElement, ctrl: GUIPopupController) {
      // Non-bubbling so the document-level outside-click listener stays out
      // of the assertion; the anchor handler still fires at the target.
      target.addEventListener('click', ctrl.onAnchorClick);
      target.dispatchEvent(new MouseEvent('click'));
      target.removeEventListener('click', ctrl.onAnchorClick);
    }

    it("clickIntent 'ignore' prevents any state change", () => {
      const clickIntent = vi.fn(() => 'ignore' as const);
      const { ctrl, anchor } = setup({ clickIntent });

      clickOn(anchor, ctrl);
      expect(clickIntent).toHaveBeenCalledWith(anchor);
      expect(ctrl.open).toBe(false);

      ctrl.show();
      clickOn(anchor, ctrl);
      expect(ctrl.open).toBe(true);
    });

    it("clickIntent 'open' opens when closed and keeps an open popup open", () => {
      const { ctrl, anchor } = setup({ clickIntent: () => 'open' });

      clickOn(anchor, ctrl);
      expect(ctrl.open).toBe(true);
      clickOn(anchor, ctrl);
      expect(ctrl.open).toBe(true);
    });

    it("clickIntent 'toggle' toggles per keyToggleMode", () => {
      const { ctrl, anchor } = setup({ clickIntent: () => 'toggle', keyToggleMode: 'openClose' });

      clickOn(anchor, ctrl);
      expect(ctrl.open).toBe(true);
      clickOn(anchor, ctrl);
      expect(ctrl.open).toBe(false);
    });

    it("clickIntent 'toggle' with mode 'toggle' flips directly (scalar pickers)", () => {
      const beforeOpen = vi.fn();
      const { ctrl, anchor } = setup({
        clickIntent: () => 'toggle',
        keyToggleMode: 'toggle',
        beforeOpen,
      });

      clickOn(anchor, ctrl);
      expect(ctrl.open).toBe(true);
      expect(beforeOpen).not.toHaveBeenCalled();
    });

    it('does nothing while disabled', () => {
      const clickIntent = vi.fn(() => 'toggle' as const);
      const { ctrl, anchor } = setup({ isDisabled: () => true, clickIntent });

      clickOn(anchor, ctrl);
      expect(clickIntent).not.toHaveBeenCalled();
      expect(ctrl.open).toBe(false);
    });
  });

  describe('hostDisconnected', () => {
    it('removes the document click listener', () => {
      const { ctrl, disconnect } = setup();
      ctrl.show();

      disconnect();
      outsideClick();
      expect(ctrl.open).toBe(true); // no longer listening
    });

    it('removes the host focusout listener and cancels a pending focusout rAF', () => {
      const { host, ctrl, disconnect } = setup();
      ctrl.show();

      host.dispatchEvent(focusOutEvent(null));
      expect(rafQueue.size).toBe(1);

      disconnect();
      expect(rafQueue.size).toBe(0); // pending deferral cancelled
      flushRaf();
      expect(ctrl.open).toBe(true);

      host.dispatchEvent(focusOutEvent(null));
      flushRaf();
      expect(ctrl.open).toBe(true); // listener removed
    });
  });
});
