import { describe, expect, it } from 'vitest';
import {
  idleRangeSelection,
  reduceRangeSelection,
  selectionPreviewSpan,
  type RangeSelectionState,
} from './range-selection';

/**
 * Characterization tests: these pin the anchor/two-click selection state
 * machine extracted from GuiRangeCalendar.selectDate/onMouseOver (and
 * re-implemented identically in GuiRangeDateTimeCalendar.selectDate). They
 * assert the CURRENT transition semantics ahead of the calendar refactor.
 */

const day = (d: number) => new Date(2026, 0, d);

describe('idleRangeSelection', () => {
  it('is empty and not selecting', () => {
    expect(idleRangeSelection()).toEqual({ anchor: null, hover: null, selecting: false });
  });
});

describe('reduceRangeSelection - pick', () => {
  it('first pick anchors the day, starts selecting, and commits nothing', () => {
    const anchor = day(5);
    const result = reduceRangeSelection(idleRangeSelection(), { type: 'pick', date: anchor });

    expect(result.commit).toBeUndefined();
    expect(result.state.selecting).toBe(true);
    expect(result.state.anchor).toBe(anchor);
    expect(result.state.hover).toBeNull();
  });

  it('first pick leaves hover untouched (the originals never reset _nextDate there)', () => {
    const staleHover = day(2);
    const state: RangeSelectionState = { anchor: null, hover: staleHover, selecting: false };
    const result = reduceRangeSelection(state, { type: 'pick', date: day(5) });

    expect(result.state.hover).toBe(staleHover);
  });

  it('second pick after the anchor commits the ordered pair and resets to idle', () => {
    const anchor = day(5);
    const picked = day(9);
    const selecting: RangeSelectionState = { anchor, hover: day(8), selecting: true };

    const result = reduceRangeSelection(selecting, { type: 'pick', date: picked });

    expect(result.commit).toEqual({ start: anchor, end: picked });
    expect(result.commit?.start).toBe(anchor);
    expect(result.commit?.end).toBe(picked);
    expect(result.state).toEqual({ anchor: null, hover: null, selecting: false });
  });

  it('backward second pick swaps so start <= end', () => {
    const anchor = day(9);
    const picked = day(5);
    const selecting: RangeSelectionState = { anchor, hover: null, selecting: true };

    const result = reduceRangeSelection(selecting, { type: 'pick', date: picked });

    expect(result.commit?.start).toBe(picked);
    expect(result.commit?.end).toBe(anchor);
    expect(result.state).toEqual({ anchor: null, hover: null, selecting: false });
  });

  it('same-day second pick commits a single-day pair without swapping', () => {
    const anchor = day(5);
    const picked = day(5); // equal instant, distinct object
    const selecting: RangeSelectionState = { anchor, hover: null, selecting: true };

    const result = reduceRangeSelection(selecting, { type: 'pick', date: picked });

    // Equal dates: `picked < anchor` is false, so no swap — start is the
    // anchor object, end is the clicked object.
    expect(result.commit?.start).toBe(anchor);
    expect(result.commit?.end).toBe(picked);
    expect(result.commit?.start.getTime()).toBe(result.commit?.end.getTime());
    expect(result.state).toEqual({ anchor: null, hover: null, selecting: false });
  });
});

describe('reduceRangeSelection - hover', () => {
  it('during selection updates the hover preview, keeping anchor and selecting', () => {
    const anchor = day(5);
    const hovered = day(12);
    const selecting: RangeSelectionState = { anchor, hover: null, selecting: true };

    const result = reduceRangeSelection(selecting, { type: 'hover', date: hovered });

    expect(result.commit).toBeUndefined();
    expect(result.state.anchor).toBe(anchor);
    expect(result.state.selecting).toBe(true);
    expect(result.state.hover).toBe(hovered);
  });

  it('replaces a previous hover with the new one', () => {
    const selecting: RangeSelectionState = { anchor: day(5), hover: day(6), selecting: true };
    const result = reduceRangeSelection(selecting, { type: 'hover', date: day(20) });
    expect(result.state.hover).toEqual(day(20));
  });

  it('is inert when not selecting (the state is returned unchanged)', () => {
    const idle = idleRangeSelection();
    const result = reduceRangeSelection(idle, { type: 'hover', date: day(12) });

    expect(result.commit).toBeUndefined();
    expect(result.state).toBe(idle);
  });
});

describe('reduceRangeSelection - reset', () => {
  it('clears an in-progress selection back to idle with no commit', () => {
    const selecting: RangeSelectionState = { anchor: day(5), hover: day(9), selecting: true };
    const result = reduceRangeSelection(selecting, { type: 'reset' });

    expect(result.commit).toBeUndefined();
    expect(result.state).toEqual({ anchor: null, hover: null, selecting: false });
  });
});

describe('selectionPreviewSpan', () => {
  it('is null when idle, or when anchor or hover is missing', () => {
    expect(selectionPreviewSpan(idleRangeSelection())).toBeNull();
    expect(selectionPreviewSpan({ anchor: day(5), hover: null, selecting: true })).toBeNull();
    expect(selectionPreviewSpan({ anchor: null, hover: day(5), selecting: true })).toBeNull();
    // Not selecting: no preview even with both days present
    expect(selectionPreviewSpan({ anchor: day(5), hover: day(9), selecting: false })).toBeNull();
  });

  it('orders anchor -> hover when hovering after the anchor', () => {
    const anchor = day(5);
    const hover = day(9);
    const span = selectionPreviewSpan({ anchor, hover, selecting: true });
    expect(span?.start).toBe(anchor);
    expect(span?.end).toBe(hover);
  });

  it('orders hover -> anchor when hovering before the anchor', () => {
    const anchor = day(9);
    const hover = day(5);
    const span = selectionPreviewSpan({ anchor, hover, selecting: true });
    expect(span?.start).toBe(hover);
    expect(span?.end).toBe(anchor);
  });

  it('collapses to a single-day span when hovering the anchor day (tie takes the hover-first branch)', () => {
    const anchor = day(5);
    const hover = day(5);
    const span = selectionPreviewSpan({ anchor, hover, selecting: true });
    // `hover > anchor` is false on the tie, so the else branch returns
    // { start: hover, end: anchor } — same instant either way.
    expect(span?.start).toBe(hover);
    expect(span?.end).toBe(anchor);
    expect(span?.start.getTime()).toBe(span?.end.getTime());
  });
});
