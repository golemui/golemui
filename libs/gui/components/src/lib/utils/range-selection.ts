/** The in-progress selection: anchor day, hovered day, and whether active. */
export interface RangeSelectionState {
  /** First-picked day (`_anchorDate`), or null when idle. */
  anchor: Date | null;
  /** Last hovered/focused day while selecting (`_nextDate`'s date). */
  hover: Date | null;
  /** Whether a selection is in progress (`_isSelecting`). */
  selecting: boolean;
}

export type RangeSelectionEvent =
  | { type: 'pick'; date: Date }
  | { type: 'hover'; date: Date }
  | { type: 'reset' };

/** The ordered day pair produced by a completed two-click selection. */
export interface RangeSelectionCommit {
  start: Date;
  end: Date;
}

export interface RangeSelectionResult {
  state: RangeSelectionState;
  /** Present only when a second pick completed the selection. */
  commit?: RangeSelectionCommit;
}

/**
 * The idle state: no anchor, no hover, not selecting.
 *
 * @return {RangeSelectionState} A fresh idle state.
 */
export function idleRangeSelection(): RangeSelectionState {
  return { anchor: null, hover: null, selecting: false };
}

/** How a calendar should render its host picker's working endpoints. */
export type WorkingPhase =
  | { kind: 'idle' }
  | { kind: 'anchor'; iso: string }
  | { kind: 'span'; start: string; end: string };

/**
 * Reads a host picker's working endpoints as a calendar phase. A lone endpoint
 * — whichever side it came from — is an in-progress anchor the next click
 * completes, because {@link reduceRangeSelection} orders a backward pick; a
 * pair is a parked span rendered like a committed range.
 *
 * @param {string} [start] - The working start endpoint, if any.
 * @param {string} [end] - The working end endpoint, if any.
 * @return {WorkingPhase} The phase the calendar should present.
 */
export function workingPhase(start?: string, end?: string): WorkingPhase {
  if (start && end) return { kind: 'span', start, end };
  const lone = start || end;
  return lone ? { kind: 'anchor', iso: lone } : { kind: 'idle' };
}

/**
 * Advances the selection state machine.
 *
 * @param {RangeSelectionState} state - The current state.
 * @param {RangeSelectionEvent} event - The event to apply.
 * @return {RangeSelectionResult} The next state, plus the ordered commit when
 *   a second pick completed the selection.
 */
export function reduceRangeSelection(
  state: RangeSelectionState,
  event: RangeSelectionEvent,
): RangeSelectionResult {
  switch (event.type) {
    case 'pick': {
      // Start selection
      if (!state.anchor) {
        return { state: { anchor: event.date, hover: state.hover, selecting: true } };
      }

      // End selection
      let start = state.anchor;
      let end = event.date;

      // Backward selection
      if (event.date < start) {
        start = event.date;
        end = state.anchor;
      }

      return { state: idleRangeSelection(), commit: { start, end } };
    }
    case 'hover': {
      if (!state.selecting) return { state };
      return { state: { ...state, hover: event.date } };
    }
    case 'reset':
      return { state: idleRangeSelection() };
  }
}

/**
 * Returns an in progress selection both an anchor and a hovered day, or null.
 *
 * A day `d` is inside the preview when
 * `span.start.getTime() <= d.getTime() <= span.end.getTime()` — endpoints
 * inclusive, exactly as the original `isSelecting` computation.
 *
 * @param {RangeSelectionState} state - The current selection state.
 * @return {{ start: Date; end: Date } | null} The ordered preview span, or null.
 */
export function selectionPreviewSpan(
  state: RangeSelectionState,
): { start: Date; end: Date } | null {
  if (!state.selecting || !state.hover || !state.anchor) return null;

  if (state.hover.getTime() > state.anchor.getTime()) {
    return { start: state.anchor, end: state.hover };
  }
  return { start: state.hover, end: state.anchor };
}
