import { describe, expect, it } from 'vitest';
import { chunk, gridKeyStep, listPageSize, nextEnabledIndex } from './grid-nav';

/**
 * Characterization tests: these pin the CURRENT keyboard-navigation semantics
 * extracted from AbstractCalendar (day grid + year grid) and GuiTimeList
 * ahead of the calendar refactor. They assert what the code does today.
 */

/** isDisabled callback over a boolean flags array (true = disabled). */
const disabledFlags =
  (flags: boolean[]) =>
  (index: number): boolean =>
    flags[index];

describe('nextEnabledIndex - calendar defaults (exclusive start, raw out-of-bounds)', () => {
  it('moves by step to the next enabled index, never returning the start index', () => {
    const flags = [false, false, false, false];
    expect(nextEnabledIndex(1, 1, 4, disabledFlags(flags))).toBe(2);
    expect(nextEnabledIndex(1, -1, 4, disabledFlags(flags))).toBe(0);
  });

  it('skips disabled entries in the walk direction', () => {
    //            0      1     2     3      4
    const flags = [false, true, true, false, false];
    expect(nextEnabledIndex(0, 1, 5, disabledFlags(flags))).toBe(3);
    expect(nextEnabledIndex(3, -1, 5, disabledFlags(flags))).toBe(0);
  });

  it('walks by multi-column steps (the day grid moves by ±7)', () => {
    const flags = Array.from({ length: 30 }, (_, i) => i === 10 || i === 17);
    // 3 -> 10 (disabled) -> 17 (disabled) -> 24
    expect(nextEnabledIndex(3, 7, 30, disabledFlags(flags))).toBe(24);
  });

  it('returns the RAW positive out-of-bounds index (the month-crossing math depends on it)', () => {
    const allEnabled = Array.from({ length: 30 }, () => false);
    // 25 + 7 = 32, immediately out of bounds: returned as-is, not clamped to 30
    expect(nextEnabledIndex(25, 7, 30, disabledFlags(allEnabled))).toBe(32);

    const tailDisabled = Array.from({ length: 30 }, (_, i) => i >= 24);
    // 17 -> 24 (disabled) -> 31
    expect(nextEnabledIndex(17, 7, 30, disabledFlags(tailDisabled))).toBe(31);
  });

  it('returns the RAW negative out-of-bounds index', () => {
    const allEnabled = Array.from({ length: 35 }, () => false);
    expect(nextEnabledIndex(2, -7, 35, disabledFlags(allEnabled))).toBe(-5);
    expect(nextEnabledIndex(0, -1, 35, disabledFlags(allEnabled))).toBe(-1);
  });
});

describe('nextEnabledIndex - time-list semantics (inclusive start, -1 out of bounds)', () => {
  const timeList = { includeStart: true, outOfBounds: 'none' } as const;

  it('returns the start index itself when it is enabled (arrow landing)', () => {
    const flags = [true, false, true, false];
    expect(nextEnabledIndex(1, 1, 4, disabledFlags(flags), timeList)).toBe(1);
  });

  it('walks off a disabled landing in the step direction', () => {
    const flags = [true, true, false, true, false];
    // Home: first enabled from 0 forward
    expect(nextEnabledIndex(0, 1, 5, disabledFlags(flags), timeList)).toBe(2);
    // End: last enabled from length-1 backward
    expect(nextEnabledIndex(4, -1, 5, disabledFlags(flags), timeList)).toBe(4);
    expect(nextEnabledIndex(3, -1, 5, disabledFlags(flags), timeList)).toBe(2);
  });

  it('returns -1 instead of the raw index when the walk leaves the list', () => {
    const allDisabled = [true, true, true];
    expect(nextEnabledIndex(0, 1, 3, disabledFlags(allDisabled), timeList)).toBe(-1);
    expect(nextEnabledIndex(2, -1, 3, disabledFlags(allDisabled), timeList)).toBe(-1);
  });

  it('returns -1 for an empty list (End on zero options)', () => {
    expect(nextEnabledIndex(-1, -1, 0, () => false, timeList)).toBe(-1);
  });
});

describe('gridKeyStep - day grid (columns 7)', () => {
  const ltr = { columns: 7, isRTL: false };
  const rtl = { columns: 7, isRTL: true };

  it('maps vertical arrows to ±columns (±7)', () => {
    expect(gridKeyStep('ArrowUp', ltr)).toEqual({ kind: 'delta', delta: -7 });
    expect(gridKeyStep('ArrowDown', ltr)).toEqual({ kind: 'delta', delta: 7 });
    // Vertical arrows do not flip in RTL
    expect(gridKeyStep('ArrowUp', rtl)).toEqual({ kind: 'delta', delta: -7 });
    expect(gridKeyStep('ArrowDown', rtl)).toEqual({ kind: 'delta', delta: 7 });
  });

  it('maps horizontal arrows to ±1, flipped in RTL', () => {
    expect(gridKeyStep('ArrowLeft', ltr)).toEqual({ kind: 'delta', delta: -1 });
    expect(gridKeyStep('ArrowRight', ltr)).toEqual({ kind: 'delta', delta: 1 });
    expect(gridKeyStep('ArrowLeft', rtl)).toEqual({ kind: 'delta', delta: 1 });
    expect(gridKeyStep('ArrowRight', rtl)).toEqual({ kind: 'delta', delta: -1 });
  });

  it('maps PageUp/PageDown to none when no pageSize is given (the calendars do not page)', () => {
    expect(gridKeyStep('PageUp', ltr)).toEqual({ kind: 'none' });
    expect(gridKeyStep('PageDown', ltr)).toEqual({ kind: 'none' });
  });

  it('leaves selection/close and unrelated keys to the caller', () => {
    for (const key of ['Enter', ' ', 'Escape', 'Tab', 'a']) {
      expect(gridKeyStep(key, ltr)).toEqual({ kind: 'none' });
    }
  });
});

describe('gridKeyStep - year grid (columns 4)', () => {
  it('maps vertical arrows to ±4', () => {
    expect(gridKeyStep('ArrowUp', { columns: 4, isRTL: false })).toEqual({
      kind: 'delta',
      delta: -4,
    });
    expect(gridKeyStep('ArrowDown', { columns: 4, isRTL: false })).toEqual({
      kind: 'delta',
      delta: 4,
    });
  });

  it('flips horizontal arrows in RTL', () => {
    expect(gridKeyStep('ArrowLeft', { columns: 4, isRTL: true })).toEqual({
      kind: 'delta',
      delta: 1,
    });
    expect(gridKeyStep('ArrowRight', { columns: 4, isRTL: true })).toEqual({
      kind: 'delta',
      delta: -1,
    });
  });
});

describe('gridKeyStep - time list', () => {
  it('maps vertical arrows to ±columns in multi-column lists', () => {
    expect(gridKeyStep('ArrowUp', { columns: 4, isRTL: false, pageSize: 28 })).toEqual({
      kind: 'delta',
      delta: -4,
    });
    expect(gridKeyStep('ArrowDown', { columns: 4, isRTL: false, pageSize: 28 })).toEqual({
      kind: 'delta',
      delta: 4,
    });
  });

  it('single-column list: horizontal arrows are inert, vertical arrows step by 1', () => {
    const single = { columns: 1, isRTL: false, pageSize: 7 };
    expect(gridKeyStep('ArrowLeft', single)).toEqual({ kind: 'none' });
    expect(gridKeyStep('ArrowRight', single)).toEqual({ kind: 'none' });
    // Inert even in RTL
    expect(gridKeyStep('ArrowLeft', { ...single, isRTL: true })).toEqual({ kind: 'none' });
    expect(gridKeyStep('ArrowUp', single)).toEqual({ kind: 'delta', delta: -1 });
    expect(gridKeyStep('ArrowDown', single)).toEqual({ kind: 'delta', delta: 1 });
  });

  it('maps PageUp/PageDown to ±pageSize', () => {
    const options = { columns: 4, isRTL: false, pageSize: 28 };
    expect(gridKeyStep('PageUp', options)).toEqual({ kind: 'delta', delta: -28 });
    expect(gridKeyStep('PageDown', options)).toEqual({ kind: 'delta', delta: 28 });
  });

  it('maps Home/End to edge results (resolved to first/last ENABLED by the caller)', () => {
    const options = { columns: 4, isRTL: false, pageSize: 28 };
    expect(gridKeyStep('Home', options)).toEqual({ kind: 'edge', edge: 'first' });
    expect(gridKeyStep('End', options)).toEqual({ kind: 'edge', edge: 'last' });
  });
});

describe('listPageSize', () => {
  it('computes visible rows times columns', () => {
    expect(listPageSize(200, 35, 2)).toBe(10); // floor(200/35)=5, *2
    expect(listPageSize(300, 40, 4)).toBe(28); // floor(300/40)=7, *4
  });

  it('defaults height to 300 and itemHeight to 40 and columns to 1', () => {
    expect(listPageSize(undefined, undefined, undefined)).toBe(7);
  });

  it('height defaults with ?? — an explicit 0 is honored and clamps to one row', () => {
    expect(listPageSize(0, 40, 3)).toBe(3); // max(1, floor(0/40)) * 3
  });

  it('itemHeight and columns default with || — 0 falls back like undefined (Vue passes 0)', () => {
    expect(listPageSize(undefined, 0, 3)).toBe(21); // floor(300/40)=7, *3
    expect(listPageSize(undefined, 40, 0)).toBe(7); // columns 0 -> 1
  });

  it('never pages less than one row', () => {
    expect(listPageSize(10, 40, 1)).toBe(1);
    expect(listPageSize(10, 40, 4)).toBe(4);
  });
});

describe('chunk', () => {
  it('splits into consecutive chunks, last one shorter', () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7, 8], 7)).toEqual([[1, 2, 3, 4, 5, 6, 7], [8]]);
  });

  it('splits a 42-cell grid into 6 weeks of 7', () => {
    const cells = Array.from({ length: 42 }, (_, i) => i);
    const weeks = chunk(cells, 7);
    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weeks[5]).toEqual([35, 36, 37, 38, 39, 40, 41]);
  });

  it('splits year rows of 4 (chunkYears)', () => {
    expect(chunk([2024, 2025, 2026, 2027, 2028], 4)).toEqual([[2024, 2025, 2026, 2027], [2028]]);
  });

  it('returns an empty array for empty input', () => {
    expect(chunk([], 7)).toEqual([]);
  });

  it('returns one chunk when size exceeds the input length', () => {
    expect(chunk([1, 2], 7)).toEqual([[1, 2]]);
  });
});
