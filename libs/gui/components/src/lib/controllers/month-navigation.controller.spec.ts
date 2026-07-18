// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import {
  GUIMonthNavigationController,
  type GUIMonthNavigationControllerOptions,
  type GUIMonthNavigationHost,
} from './month-navigation.controller';

/**
 * Characterization tests for the month/year navigation state extracted from
 * the byte-identical members of GuiCalendar and GuiRangeCalendar. A fake
 * reactive host records requestUpdate calls; the option closures stand in for
 * the hosts' minDate/maxDate/numberOfMonths/disabledRanges properties.
 */

function createHost(): GUIMonthNavigationHost {
  const controllers: ReactiveController[] = [];
  return {
    addController: (c: ReactiveController) => controllers.push(c),
    removeController: (c: ReactiveController) => {
      const index = controllers.indexOf(c);
      if (index > -1) controllers.splice(index, 1);
    },
    requestUpdate: vi.fn(),
    updateComplete: Promise.resolve(true),
  } satisfies ReactiveControllerHost;
}

interface Setup {
  host: GUIMonthNavigationHost;
  ctrl: GUIMonthNavigationController;
  options: GUIMonthNavigationControllerOptions;
}

function setup(overrides: Partial<GUIMonthNavigationControllerOptions> = {}): Setup {
  const host = createHost();
  const options: GUIMonthNavigationControllerOptions = {
    getMinDate: () => undefined,
    getMaxDate: () => undefined,
    getNumberOfMonths: () => 1,
    getDisabledRanges: () => undefined,
    ...overrides,
  };
  const ctrl = new GUIMonthNavigationController(host, options);
  return { host, ctrl, options };
}

describe('GUIMonthNavigationController', () => {
  it('registers itself on the host', () => {
    const host = createHost();
    const addController = vi.spyOn(host, 'addController');
    const ctrl = new GUIMonthNavigationController(host, {
      getMinDate: () => undefined,
      getMaxDate: () => undefined,
      getNumberOfMonths: () => 1,
      getDisabledRanges: () => undefined,
    });
    expect(addController).toHaveBeenCalledWith(ctrl);
  });

  it('starts on today with the year selector closed', () => {
    const { ctrl } = setup();
    const now = new Date();
    expect(ctrl.currentDate.getFullYear()).toBe(now.getFullYear());
    expect(ctrl.currentDate.getMonth()).toBe(now.getMonth());
    expect(ctrl.yearSelectorOpen).toBe(false);
  });

  describe('state mutation', () => {
    it('requests a host update when currentDate changes', () => {
      const { host, ctrl } = setup();
      ctrl.currentDate = new Date(2024, 2, 15);
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
      expect(ctrl.currentDate).toEqual(new Date(2024, 2, 15));
    });

    it('does not request an update when the same Date reference is reassigned', () => {
      const { host, ctrl } = setup();
      const date = new Date(2024, 2, 15);
      ctrl.currentDate = date;
      ctrl.currentDate = date;
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it('requests a host update when yearSelectorOpen changes, but not on a same-value write', () => {
      const { host, ctrl } = setup();
      ctrl.yearSelectorOpen = false;
      expect(host.requestUpdate).not.toHaveBeenCalled();
      ctrl.yearSelectorOpen = true;
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
      ctrl.yearSelectorOpen = true;
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('month stepping', () => {
    it('prevMonth steps to the first day of the previous month', () => {
      const { host, ctrl } = setup();
      ctrl.currentDate = new Date(2024, 2, 15);
      ctrl.prevMonth();
      expect(ctrl.currentDate).toEqual(new Date(2024, 1, 1));
      expect(host.requestUpdate).toHaveBeenCalledTimes(2);
    });

    it('nextMonth steps to the first day of the next month', () => {
      const { ctrl } = setup();
      ctrl.currentDate = new Date(2024, 2, 15);
      ctrl.nextMonth();
      expect(ctrl.currentDate).toEqual(new Date(2024, 3, 1));
    });

    it('steps across year boundaries', () => {
      const { ctrl } = setup();
      ctrl.currentDate = new Date(2024, 0, 20);
      ctrl.prevMonth();
      expect(ctrl.currentDate).toEqual(new Date(2023, 11, 1));

      ctrl.currentDate = new Date(2024, 11, 20);
      ctrl.nextMonth();
      expect(ctrl.currentDate).toEqual(new Date(2025, 0, 1));
    });
  });

  describe('canGoPrev', () => {
    it('always allows when no minDate is set', () => {
      const { ctrl } = setup();
      expect(ctrl.canGoPrev()).toBe(true);
    });

    it('allows while the last day of the previous month is on or after minDate', () => {
      const { ctrl } = setup({ getMinDate: () => '2024-02-29' });
      ctrl.currentDate = new Date(2024, 2, 10);
      expect(ctrl.canGoPrev()).toBe(true);
    });

    it('blocks when the previous month ends before minDate', () => {
      const { ctrl } = setup({ getMinDate: () => '2024-03-01' });
      ctrl.currentDate = new Date(2024, 2, 10);
      expect(ctrl.canGoPrev()).toBe(false);
    });
  });

  describe('canGoNext', () => {
    it('always allows when no maxDate is set', () => {
      const { ctrl } = setup();
      expect(ctrl.canGoNext()).toBe(true);
    });

    it('allows while the first day of the next month is on or before maxDate', () => {
      const { ctrl } = setup({ getMaxDate: () => '2024-04-01' });
      ctrl.currentDate = new Date(2024, 2, 10);
      expect(ctrl.canGoNext()).toBe(true);
    });

    it('blocks when the next month starts after maxDate', () => {
      const { ctrl } = setup({ getMaxDate: () => '2024-03-31' });
      ctrl.currentDate = new Date(2024, 2, 10);
      expect(ctrl.canGoNext()).toBe(false);
    });

    it('accounts for the last visible panel when several months render', () => {
      const { ctrl } = setup({
        getMaxDate: () => '2024-05-01',
        getNumberOfMonths: () => 2,
      });
      ctrl.currentDate = new Date(2024, 2, 10);
      expect(ctrl.canGoNext()).toBe(true);

      const blocked = setup({
        getMaxDate: () => '2024-04-30',
        getNumberOfMonths: () => 2,
      });
      blocked.ctrl.currentDate = new Date(2024, 2, 10);
      expect(blocked.ctrl.canGoNext()).toBe(false);
    });

    it('treats an undefined numberOfMonths as 1', () => {
      const { ctrl } = setup({
        getMaxDate: () => '2024-04-01',
        getNumberOfMonths: () => undefined,
      });
      ctrl.currentDate = new Date(2024, 2, 10);
      expect(ctrl.canGoNext()).toBe(true);
    });
  });

  describe('year list', () => {
    it('defaults to the 1900..2099 window', () => {
      const { ctrl } = setup();
      expect(ctrl.effectiveMinYear).toBe(1900);
      expect(ctrl.effectiveMaxYear).toBe(2099);
      expect(ctrl.yearList).toHaveLength(200);
      expect(ctrl.yearList[0]).toBe(1900);
      expect(ctrl.yearList[199]).toBe(2099);
    });

    it('derives the bounds from minDate/maxDate, inclusive', () => {
      const { ctrl } = setup({
        getMinDate: () => '2020-06-15',
        getMaxDate: () => '2023-01-01',
      });
      expect(ctrl.effectiveMinYear).toBe(2020);
      expect(ctrl.effectiveMaxYear).toBe(2023);
      expect(ctrl.yearList).toEqual([2020, 2021, 2022, 2023]);
    });
  });

  describe('toggleYearSelector', () => {
    it('flips the open state and requests an update each time', () => {
      const { host, ctrl } = setup();
      ctrl.toggleYearSelector();
      expect(ctrl.yearSelectorOpen).toBe(true);
      ctrl.toggleYearSelector();
      expect(ctrl.yearSelectorOpen).toBe(false);
      expect(host.requestUpdate).toHaveBeenCalledTimes(2);
    });

    it('notifies onYearSelectorToggled on open AND close, after the flip', () => {
      const seen: boolean[] = [];
      const { ctrl } = setup({
        onYearSelectorToggled: () => seen.push(ctrl.yearSelectorOpen),
      });
      ctrl.toggleYearSelector();
      ctrl.toggleYearSelector();
      expect(seen).toEqual([true, false]);
    });

    it('works without the optional onYearSelectorToggled hook', () => {
      const { ctrl } = setup();
      expect(() => ctrl.toggleYearSelector()).not.toThrow();
      expect(ctrl.yearSelectorOpen).toBe(true);
    });
  });

  describe('selectYear', () => {
    it('jumps to the same month of the picked year and closes the grid', () => {
      const { ctrl } = setup();
      ctrl.currentDate = new Date(2024, 2, 15);
      ctrl.yearSelectorOpen = true;
      ctrl.selectYear(2020);
      expect(ctrl.currentDate).toEqual(new Date(2020, 2, 1));
      expect(ctrl.yearSelectorOpen).toBe(false);
    });
  });

  describe('closeYearSelector', () => {
    it('closes the grid, and is update-silent when already closed', () => {
      const { host, ctrl } = setup();
      ctrl.yearSelectorOpen = true;
      ctrl.closeYearSelector();
      expect(ctrl.yearSelectorOpen).toBe(false);
      expect(host.requestUpdate).toHaveBeenCalledTimes(2);
      ctrl.closeYearSelector();
      expect(host.requestUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('navigateToDate', () => {
    it('jumps to a date outside the visible months', () => {
      const { ctrl } = setup();
      ctrl.currentDate = new Date(2024, 2, 15);
      const target = new Date(2024, 5, 10);
      ctrl.navigateToDate(target);
      expect(ctrl.currentDate).toBe(target);
    });

    it('leaves the cursor alone when the date is already visible', () => {
      const { host, ctrl } = setup();
      const cursor = new Date(2024, 2, 15);
      ctrl.currentDate = cursor;
      ctrl.navigateToDate(new Date(2024, 2, 28));
      expect(ctrl.currentDate).toBe(cursor);
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it('honors numberOfMonths when deciding visibility', () => {
      const { ctrl } = setup({ getNumberOfMonths: () => 2 });
      const cursor = new Date(2024, 2, 15);
      ctrl.currentDate = cursor;
      ctrl.navigateToDate(new Date(2024, 3, 10));
      expect(ctrl.currentDate).toBe(cursor);
      ctrl.navigateToDate(new Date(2024, 4, 10));
      expect(ctrl.currentDate).toEqual(new Date(2024, 4, 10));
    });

    it('ignores invalid dates', () => {
      const { host, ctrl } = setup();
      const cursor = new Date(2024, 2, 15);
      ctrl.currentDate = cursor;
      ctrl.navigateToDate(new Date(NaN));
      expect(ctrl.currentDate).toBe(cursor);
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('isDisabled', () => {
    it('disables days before minDate and after maxDate, bounds inclusive', () => {
      const { ctrl } = setup({
        getMinDate: () => '2024-03-10',
        getMaxDate: () => '2024-03-20',
      });
      expect(ctrl.isDisabled(new Date(2024, 2, 9))).toBe(true);
      expect(ctrl.isDisabled(new Date(2024, 2, 10))).toBe(false);
      expect(ctrl.isDisabled(new Date(2024, 2, 20))).toBe(false);
      expect(ctrl.isDisabled(new Date(2024, 2, 21))).toBe(true);
    });

    it('disables days inside the disabled ranges', () => {
      const { ctrl } = setup({
        getDisabledRanges: () => [{ start: '2024-03-15', end: '2024-03-17' }],
      });
      expect(ctrl.isDisabled(new Date(2024, 2, 14))).toBe(false);
      expect(ctrl.isDisabled(new Date(2024, 2, 16))).toBe(true);
      expect(ctrl.isDisabled(new Date(2024, 2, 18))).toBe(false);
    });

    it('allows everything when no bounds or ranges are set', () => {
      const { ctrl } = setup();
      expect(ctrl.isDisabled(new Date(2024, 2, 16))).toBe(false);
    });
  });
});
