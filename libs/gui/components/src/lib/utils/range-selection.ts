/**
 * The pure anchor/two-click range-selection state machine shared by
 * `GuiRangeCalendar.selectDate`/`onMouseOver` and the re-implementation in
 * `GuiRangeDateTimeCalendar.selectDate` (which parks the committed pair as a
 * working range instead of merging a pill — the commit TARGET differs, the
 * state machine does not).
 *
 * What stays in the callers, by design (the two originals diverge exactly
 * there):
 * - The pick guards (`!day.isCurrentMonth || disabled || readOnly`).
 * - Clearing/raising the invalid-range highlight and any working state on the
 *   first pick.
 * - Disabled-span rejection of the committed pair (`rangeSpansDisabledDay` vs
 *   `spanCoversBlockedDay`) — the reducer always reports the ordered commit;
 *   the caller decides whether it survives.
 * - Merge + change dispatch (range calendar) vs parking the working range
 *   (range date-time calendar).
 */

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

/**
 * Advances the selection state machine. Transition table (pinned by the
 * colocated spec):
 *
 * - pick with no anchor: anchors the day and starts selecting (hover is left
 *   untouched, as the originals never reset `_nextDate` on the first pick —
 *   it is already null from the previous completed selection).
 * - pick with an anchor: completes the selection — the pair is ordered with a
 *   backward swap (`clicked < anchor` compares the Date instants), state
 *   returns to idle, and the ordered pair is reported as `commit`. A same-day
 *   second pick commits a single-day pair (start === anchor, end === clicked).
 * - hover while selecting: records the hovered day for the live preview.
 * - hover while not selecting: inert (the state is returned unchanged).
 * - reset: back to idle, no commit.
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
 * The live hover-preview span `GuiRangeCalendar.checkDateStatus` derives from
 * anchor + hover while selecting: the inclusive day span between them,
 * ordered either way. Null unless a selection is in progress with both an
 * anchor and a hovered day.
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
