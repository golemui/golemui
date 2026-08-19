// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUIEditSessionController,
  type GUIEditSessionHost,
  type GUIEditSessionOptions,
} from './edit-session.controller';
import { rangeKey, type RangeLike } from '../utils/pill-ranges';
import type { GuiPills } from '../components/pills';

const compareISO = (a: string, b: string) => a.localeCompare(b);

interface Harness {
  controller: GUIEditSessionController<RangeLike>;
  options: {
    enabled: boolean;
    ranges: RangeLike[];
    loadRange: ReturnType<typeof vi.fn>;
    clearCompose: ReturnType<typeof vi.fn>;
    onStateChanged: ReturnType<typeof vi.fn>;
    focusPillAt: ReturnType<typeof vi.fn>;
  };
}

const createHarness = (): Harness => {
  const host = document.createElement('div') as unknown as GUIEditSessionHost;
  host.addController = () => undefined;
  host.requestUpdate = () => undefined;
  (host as { updateComplete: Promise<boolean> }).updateComplete = Promise.resolve(true);

  const state = {
    enabled: true,
    ranges: [
      { start: '2026-08-01', end: '2026-08-05' },
      { start: '2026-08-10', end: '2026-08-14' },
    ] as RangeLike[],
    loadRange: vi.fn(),
    clearCompose: vi.fn(),
    onStateChanged: vi.fn(),
    focusPillAt: vi.fn(),
  };

  const options: GUIEditSessionOptions<RangeLike> = {
    isEnabled: () => state.enabled,
    getRanges: () => state.ranges,
    compareStarts: compareISO,
    formatLabel: (range) => `${range.start} - ${range.end ?? range.start}`,
    loadRange: state.loadRange,
    clearCompose: state.clearCompose,
    onStateChanged: state.onStateChanged,
    getPills: () => ({ focusPillAt: state.focusPillAt }) as unknown as GuiPills,
    getMessages: () => ({
      started: 'Editing range {label}.',
      committed: 'Range updated to {label}.',
      cancelled: 'Edit cancelled.',
    }),
  };

  return { controller: new GUIEditSessionController(host, options), options: state };
};

const escapeEvent = () =>
  new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });

describe('GUIEditSessionController', () => {
  let h: Harness;
  let firstKey: string;
  let secondKey: string;

  beforeEach(() => {
    h = createHarness();
    firstKey = rangeKey(h.options.ranges[0]);
    secondKey = rangeKey(h.options.ranges[1]);
  });

  describe('selection', () => {
    it('ignores pill clicks while disabled', () => {
      h.options.enabled = false;
      expect(h.controller.handlePillClick(firstKey)).toBe('ignored');
      expect(h.controller.selectedKey).toBeNull();
      expect(h.options.onStateChanged).not.toHaveBeenCalled();
    });

    it('selects on click and resolves the selected range', () => {
      expect(h.controller.handlePillClick(firstKey)).toBe('selected');
      expect(h.controller.selectedKey).toBe(firstKey);
      expect(h.controller.selectedRange).toEqual(h.options.ranges[0]);
      expect(h.options.onStateChanged).toHaveBeenCalledTimes(1);
    });

    it('keeps the selection when the selected pill is clicked again', () => {
      h.controller.handlePillClick(firstKey);
      expect(h.controller.handlePillClick(firstKey)).toBe('selected');
      expect(h.controller.selectedKey).toBe(firstKey);
      // No state changed, so no extra notification fires.
      expect(h.options.onStateChanged).toHaveBeenCalledTimes(1);
    });

    it('moves the selection when another pill is clicked', () => {
      h.controller.handlePillClick(firstKey);
      expect(h.controller.handlePillClick(secondKey)).toBe('selected');
      expect(h.controller.selectedKey).toBe(secondKey);
    });
  });

  describe('startEdit', () => {
    it('refuses without a selection', () => {
      expect(h.controller.startEdit()).toBe(false);
      expect(h.options.loadRange).not.toHaveBeenCalled();
    });

    it('loads the selected range and announces the start', () => {
      h.controller.handlePillClick(firstKey);
      expect(h.controller.startEdit()).toBe(true);
      expect(h.controller.editing?.key).toBe(firstKey);
      expect(h.options.loadRange).toHaveBeenCalledWith(h.options.ranges[0]);
      expect(h.controller.announcement).toBe('Editing range 2026-08-01 - 2026-08-05.');
    });

    it('refuses while disabled or already editing', () => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
      expect(h.controller.startEdit()).toBe(false);
      h.controller.cancel();
      h.options.enabled = false;
      expect(h.controller.startEdit()).toBe(false);
    });
  });

  describe('baseRanges', () => {
    it('returns a copy of everything while not editing', () => {
      const base = h.controller.baseRanges(h.options.ranges);
      expect(base).toEqual(h.options.ranges);
      expect(base).not.toBe(h.options.ranges);
    });

    it('excludes the range being edited', () => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
      expect(h.controller.baseRanges(h.options.ranges)).toEqual([h.options.ranges[1]]);
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
    });

    it('clears the compose surface, keeps the selection, announces', () => {
      h.controller.cancel();
      expect(h.controller.editing).toBeNull();
      expect(h.controller.selectedKey).toBe(firstKey);
      expect(h.options.clearCompose).toHaveBeenCalledTimes(1);
      expect(h.controller.announcement).toBe('Edit cancelled.');
    });

    it('supports silent and keepCompose variants', () => {
      const started = h.controller.announcement;
      h.controller.cancel({ silent: true, keepCompose: true });
      expect(h.controller.editing).toBeNull();
      expect(h.options.clearCompose).not.toHaveBeenCalled();
      expect(h.controller.announcement).toBe(started);
    });
  });

  describe('mid-edit pill clicks', () => {
    beforeEach(() => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
    });

    it('clicking the editing pill cancels but keeps it selected', () => {
      expect(h.controller.handlePillClick(firstKey)).toBe('cancelled');
      expect(h.controller.editing).toBeNull();
      expect(h.controller.selectedKey).toBe(firstKey);
    });

    it('clicking another pill cancels the session and only selects it', () => {
      expect(h.controller.handlePillClick(secondKey)).toBe('selected');
      expect(h.controller.editing).toBeNull();
      expect(h.controller.selectedKey).toBe(secondKey);
      expect(h.options.clearCompose).toHaveBeenCalledTimes(1);
    });
  });

  describe('completed', () => {
    it('selects, announces and focuses the resulting (possibly merged) pill', async () => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
      // The host committed a replacement that merged into the neighbor.
      h.options.ranges = [{ start: '2026-08-03', end: '2026-08-14' }];
      h.controller.completed('2026-08-03');
      expect(h.controller.editing).toBeNull();
      expect(h.controller.selectedKey).toBe(rangeKey(h.options.ranges[0]));
      expect(h.controller.announcement).toBe('Range updated to 2026-08-03 - 2026-08-14.');
      // Focus is deferred past the host render (dirty-part change-event race).
      expect(h.options.focusPillAt).not.toHaveBeenCalled();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(h.options.focusPillAt).toHaveBeenCalledWith(0);
    });

    it('is a no-op without an open session', async () => {
      h.controller.completed('2026-08-03');
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(h.options.focusPillAt).not.toHaveBeenCalled();
    });

    it('skips the focus move when asked (focus-leave commits must not steal focus)', async () => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
      h.options.ranges = [{ start: '2026-08-03', end: '2026-08-14' }];
      h.controller.completed('2026-08-03', { focus: false });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(h.options.focusPillAt).not.toHaveBeenCalled();
      expect(h.controller.selectedKey).toBe(rangeKey(h.options.ranges[0]));
    });
  });

  describe('handleFocusLeave', () => {
    it('clears the selection silently, hiding the pill actions', () => {
      h.controller.handlePillClick(firstKey);
      const announcement = h.controller.announcement;
      h.controller.handleFocusLeave();
      expect(h.controller.selectedKey).toBeNull();
      expect(h.controller.announcement).toBe(announcement);
    });

    it('is a no-op without a selection', () => {
      h.controller.handleFocusLeave();
      expect(h.options.onStateChanged).not.toHaveBeenCalled();
    });
  });

  describe('handleEscape', () => {
    it('first cancels the session, focusing the still-selected pill', async () => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
      const event = escapeEvent();
      expect(h.controller.handleEscape(event)).toBe(true);
      expect(event.defaultPrevented).toBe(true);
      expect(h.controller.editing).toBeNull();
      expect(h.controller.selectedKey).toBe(firstKey);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(h.options.focusPillAt).toHaveBeenCalledWith(0);
    });

    it('then clears the selection', () => {
      h.controller.handlePillClick(firstKey);
      expect(h.controller.handleEscape(escapeEvent())).toBe(true);
      expect(h.controller.selectedKey).toBeNull();
    });

    it('lets unrelated keys and idle Escapes bubble', () => {
      expect(h.controller.handleEscape(escapeEvent())).toBe(false);
      const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      h.controller.handlePillClick(firstKey);
      expect(h.controller.handleEscape(enter)).toBe(false);
    });
  });

  describe('reconcileValue', () => {
    it('silently cancels a session whose range left the value', () => {
      h.controller.handlePillClick(firstKey);
      h.controller.startEdit();
      const announcement = h.controller.announcement;
      h.options.ranges = [h.options.ranges[1]];
      h.controller.reconcileValue(h.options.ranges);
      expect(h.controller.editing).toBeNull();
      expect(h.controller.selectedKey).toBeNull();
      expect(h.controller.announcement).toBe(announcement);
    });

    it('drops a selection whose range left the value, keeps a live one', () => {
      h.controller.handlePillClick(firstKey);
      h.controller.reconcileValue(h.options.ranges);
      expect(h.controller.selectedKey).toBe(firstKey);
      h.options.ranges = [h.options.ranges[1]];
      h.controller.reconcileValue(h.options.ranges);
      expect(h.controller.selectedKey).toBeNull();
    });
  });
});
