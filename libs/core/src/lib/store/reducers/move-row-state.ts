import { type DotPath, type Uid } from '../../shared';
import { inputPath } from '../../utils/form';
import { setOwnKey } from '../../utils/object';
import { toRepeaterItemUid } from '../../utils/repeater';
import { type RepeaterRowChange } from '../actions';
import { type RepeaterRow, type State } from '../model';

/**
 * Moves the state of the rows of one repeater after a row was removed, so the state stays with its
 * row. The entries of the removed row are deleted. The rows of nested repeaters move too.
 *
 * Only the entries of row widgets move. A static input whose path points into a row keeps its entries.
 *
 * @param state - The state whose `repeaterRows` and `resolvedSources` still describe the rows before
 *   the removal.
 * @param repeaterPath - The concrete path of the repeater array.
 * @param rowChange - The row that was removed.
 * @returns The same state when no entry moved, otherwise a new one. Each record is also returned by
 *   reference when none of its keys changed.
 *
 * @example
 * // Row 0 of `users` is removed.
 * // touchedControls: { 'users.1.name': true } -> { 'users.0.name': true }
 * // widgetPropOverrides: { 'name[1]': { ... } } -> { 'name[0]': { ... } }
 */
export const moveRowState = (
  state: State,
  repeaterPath: DotPath,
  rowChange: RepeaterRowChange,
): State => {
  // The action is public, so a JavaScript caller can send any value.
  if (rowChange.type !== 'removed' || !Number.isInteger(rowChange.index) || rowChange.index < 0) {
    return state;
  }
  const { uidMoves, pathMoves } = collectKeyMoves(state, repeaterPath, rowChange.index);

  const touchedControls = renameKeys(state.touchedControls, pathMoves);
  const validations = renameKeys(state.validations, pathMoves);
  const injectedValidations = renameKeys(state.injectedValidations, pathMoves);
  const widgetPropOverrides = renameKeys(state.widgetPropOverrides, uidMoves);

  if (
    touchedControls === state.touchedControls &&
    validations === state.validations &&
    injectedValidations === state.injectedValidations &&
    widgetPropOverrides === state.widgetPropOverrides
  ) {
    return state;
  }

  return { ...state, touchedControls, validations, injectedValidations, widgetPropOverrides };
};

/** The new key of each key that changes. An undefined value deletes the entry. */
type KeyMoves = Map<string, string | undefined>;

function collectKeyMoves(
  state: State,
  repeaterPath: DotPath,
  removedIndex: number,
): { uidMoves: KeyMoves; pathMoves: KeyMoves } {
  const uidMoves: KeyMoves = new Map();
  const pathMoves: KeyMoves = new Map();

  for (const [uid, rows] of Object.entries(state.repeaterRows)) {
    const level = rows.findIndex((row) => row.itemPath === `${repeaterPath}.${row.index}`);
    if (level === -1 || rows[level].index < removedIndex) {
      continue;
    }
    const row = rows[level];
    const path = inputPath(state.resolvedSources[uid as Uid]);

    if (row.index === removedIndex) {
      uidMoves.set(uid, undefined);
      if (path !== undefined) {
        pathMoves.set(path, undefined);
      }
      continue;
    }

    const newIndex = row.index - 1;
    uidMoves.set(uid, uidAtRowIndex(uid, rows, level, newIndex));
    if (path !== undefined) {
      pathMoves.set(path, `${repeaterPath}.${newIndex}${path.slice(row.itemPath.length)}`);
    }
  }

  return { uidMoves, pathMoves };
}

/** `name[1]` -> `name[0]`. The uid of the template can have brackets, so only its end changes. */
function uidAtRowIndex(uid: string, rows: RepeaterRow[], level: number, newIndex: number): string {
  const indexes = rows.map((row) => row.index);
  const indexSuffix = toRepeaterItemUid('' as Uid, indexes);
  const templateUid = uid.slice(0, uid.length - indexSuffix.length);
  indexes[level] = newIndex;
  return toRepeaterItemUid(templateUid as Uid, indexes);
}

function renameKeys<T>(record: Record<string, T>, moves: KeyMoves): Record<string, T> {
  if (!Object.keys(record).some((key) => moves.has(key))) {
    return record;
  }
  const renamed: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    const newKey = moves.has(key) ? moves.get(key) : key;
    if (newKey !== undefined) {
      setOwnKey(renamed, newKey, value);
    }
  }
  return renamed;
}
