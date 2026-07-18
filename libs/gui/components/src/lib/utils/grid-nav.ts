/**
 * Pure keyboard-navigation helpers shared by the calendar day grid and year
 * grid (`abstract-calendar.ts`) and the time list (`time-list.ts`):
 *
 * - {@link nextEnabledIndex} unifies `AbstractCalendar.findNextFocusableIndex`
 *   and `GuiTimeList.findEnabledIndex`, whose edge semantics differ (see its
 *   doc for the two knobs that cover both call sites).
 * - {@link gridKeyStep} is the key -> movement-intent mapping of all three
 *   grids. Home/End do not fit a delta model (the time list resolves them to
 *   the first/last ENABLED item), so the result is discriminated.
 * - {@link listPageSize} is the time list's PageUp/PageDown page size.
 * - {@link chunk} generalizes `AbstractCalendar.chunkDays` / `chunkYears` and
 *   the time list's row slicing.
 */

export interface NextEnabledIndexOptions {
  /**
   * When true the walk probes `from` itself first (the time list's
   * `findEnabledIndex(from, direction)`, whose landing index may already be
   * the answer). Default false: the first probe is `from + step`
   * (`AbstractCalendar.findNextFocusableIndex`, which always moves off the
   * currently focused button).
   */
  includeStart?: boolean;
  /**
   * What to return when the walk exits the list without finding an enabled
   * index. Default 'index': the raw out-of-bounds index (may be any value
   * `< 0` or `>= length`) — the calendar's month-crossing keyboard handler
   * does arithmetic with that exact value, so it must be preserved. 'none'
   * returns -1 (the time list's semantics).
   */
  outOfBounds?: 'index' | 'none';
}

/**
 * Walks from an index by `step` to the next enabled index, skipping disabled
 * entries.
 *
 * Unifies two originals with different edge semantics:
 * - `AbstractCalendar.findNextFocusableIndex(currentIndex, step, buttons)`:
 *   exclusive start (first probe `currentIndex + step`), walks by `step`
 *   (±1/±7), and returns the raw out-of-bounds index when the walk leaves the
 *   list. Defaults reproduce this exactly.
 * - `GuiTimeList.findEnabledIndex(from, direction)`: inclusive start, walks
 *   by ±1, returns -1 when out of bounds. Pass
 *   `{ includeStart: true, outOfBounds: 'none' }` (with `step` = ±1).
 *
 * @param {number} from - The reference index the walk starts from.
 * @param {number} step - Index delta per probe (positive or negative).
 * @param {number} length - Number of entries in the list.
 * @param {(index: number) => boolean} isDisabled - Whether the entry at an
 *   in-bounds index is disabled.
 * @param {NextEnabledIndexOptions} [options] - Edge-semantics knobs.
 * @return {number} The first enabled index found, otherwise the out-of-bounds
 *   result selected by `options.outOfBounds`.
 */
export function nextEnabledIndex(
  from: number,
  step: number,
  length: number,
  isDisabled: (index: number) => boolean,
  options: NextEnabledIndexOptions = {},
): number {
  const { includeStart = false, outOfBounds = 'index' } = options;
  let index = includeStart ? from : from + step;

  while (index >= 0 && index < length) {
    if (!isDisabled(index)) {
      return index;
    }
    index += step;
  }
  return outOfBounds === 'index' ? index : -1;
}

export interface GridKeyStepOptions {
  /** Items per visual row (7 for the day grid, 4 for the year grid). */
  columns: number;
  /** Right-to-left layout: horizontal arrows flip direction. */
  isRTL: boolean;
  /**
   * Items to jump on PageUp/PageDown (see {@link listPageSize}). When
   * omitted, PageUp/PageDown map to 'none' — the day and year grids do not
   * handle paging.
   */
  pageSize?: number;
}

/** The movement intent of a grid navigation key. */
export type GridKeyStepResult =
  | { kind: 'delta'; delta: number }
  | { kind: 'edge'; edge: 'first' | 'last' }
  | { kind: 'none' };

/**
 * Maps a keyboard key to a grid movement intent — the shared switch of
 * `AbstractCalendar.handleKeydown` (day grid, columns 7),
 * `AbstractCalendar.handleYearKeydown` (year grid, columns 4) and
 * `GuiTimeList.onKeyDown` (columns 1..n):
 *
 * - ArrowUp/ArrowDown: ±columns (±7 day grid, ±4 year grid, ±columns list).
 * - ArrowLeft/ArrowRight: ±1, flipped in RTL. In a single-column grid they
 *   are inert ('none' — the time list lets them fall through so the page can
 *   scroll; the day/year grids always have more than one column, so this rule
 *   never fires there).
 * - PageUp/PageDown: ±pageSize, or 'none' when `pageSize` is omitted.
 * - Home/End: 'edge' — the time list moves to the first/last ENABLED item
 *   (resolve with {@link nextEnabledIndex} from index 0 forward / length-1
 *   backward, inclusive). The day and year grids treat Home/End as unhandled
 *   today; their callers must ignore 'edge' results (and omit `pageSize`) to
 *   preserve behavior.
 * - Anything else (including Enter/Space/Escape, which are selection/close
 *   concerns of the callers): 'none'. Callers must not preventDefault on a
 *   'none' result.
 *
 * @param {string} key - The `KeyboardEvent.key` value.
 * @param {GridKeyStepOptions} options - Grid geometry and direction.
 * @return {GridKeyStepResult} The discriminated movement intent.
 */
export function gridKeyStep(key: string, options: GridKeyStepOptions): GridKeyStepResult {
  const { columns, isRTL, pageSize } = options;

  switch (key) {
    case 'ArrowUp':
      return { kind: 'delta', delta: -columns };
    case 'ArrowDown':
      return { kind: 'delta', delta: columns };
    case 'ArrowLeft':
      if (columns === 1) return { kind: 'none' };
      return { kind: 'delta', delta: isRTL ? 1 : -1 };
    case 'ArrowRight':
      if (columns === 1) return { kind: 'none' };
      return { kind: 'delta', delta: isRTL ? -1 : 1 };
    case 'PageUp':
      if (pageSize === undefined) return { kind: 'none' };
      return { kind: 'delta', delta: -pageSize };
    case 'PageDown':
      if (pageSize === undefined) return { kind: 'none' };
      return { kind: 'delta', delta: pageSize };
    case 'Home':
      return { kind: 'edge', edge: 'first' };
    case 'End':
      return { kind: 'edge', edge: 'last' };
    default:
      return { kind: 'none' };
  }
}

/**
 * The time list's PageUp/PageDown page size: visible rows (viewport height
 * over item height, at least one row) times columns.
 *
 * Fallback semantics are preserved exactly from `GuiTimeList.onKeyDown`:
 * `height` defaults with `??` (an explicit 0 is honored and clamps to one
 * row), while `itemHeight` and `columns` default with `||` — the Vue adapter
 * passes 0 for unset number props, so 0 must fall back like undefined.
 *
 * @param {number | undefined} height - Viewport height in px (default 300 via `??`).
 * @param {number | undefined} itemHeight - Item height in px (default 40 via `||`).
 * @param {number | undefined} columns - Columns (default 1 via `||`).
 * @return {number} Items to jump per page.
 */
export function listPageSize(
  height: number | undefined,
  itemHeight: number | undefined,
  columns: number | undefined,
): number {
  return Math.max(1, Math.floor((height ?? 300) / (itemHeight || 40))) * (columns || 1);
}

/**
 * Splits an array into consecutive chunks of up to `size` items — the shape
 * of `AbstractCalendar.chunkDays` (weeks of 7), `chunkYears` (rows of 4) and
 * the time list's row slicing (rows of `columns`).
 *
 * @param {T[]} items - The items to group.
 * @param {number} size - Maximum chunk length; must be a positive integer.
 * @return {T[][]} The chunks in order; the last may be shorter. Empty input
 *   yields an empty array.
 */
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
