import { type DotPath } from '../../shared';
import { inputPath } from '../../utils/form';
import { type State } from '../model';

/**
 * Removes the entries that belong to widgets the current data no longer produces, for example
 * the widgets of a repeater row that was deleted.
 *
 * `widgetPropOverrides` is keyed by uid, the other three are keyed by the input path, so a path
 * that no live input owns is dropped from them.
 *
 * @param state - The state to clean, after `resolvedSources` has been rebuilt
 * @returns The same state object when nothing was removed, otherwise a new one. Each record is
 *   also returned by reference when it did not lose an entry.
 */
export const dropRemovedWidgetEntries = (state: State): State => {
  const livePaths = collectLivePaths(state.resolvedSources);

  const widgetPropOverrides = keepLiveKeys(
    state.widgetPropOverrides,
    (uid) => uid in state.resolvedSources,
  );
  const touchedControls = keepLiveKeys(state.touchedControls, (path) => livePaths.has(path));
  const validations = keepLiveKeys(state.validations, (path) => livePaths.has(path));
  const injectedValidations = keepLiveKeys(state.injectedValidations, (path) =>
    livePaths.has(path),
  );

  if (
    widgetPropOverrides === state.widgetPropOverrides &&
    touchedControls === state.touchedControls &&
    validations === state.validations &&
    injectedValidations === state.injectedValidations
  ) {
    return state;
  }

  return { ...state, widgetPropOverrides, touchedControls, validations, injectedValidations };
};

/** The path of every input, plus the path a function widget carries when it is a control. */
function collectLivePaths(resolvedSources: State['resolvedSources']): Set<DotPath> {
  const paths = new Set<DotPath>();
  for (const widget of Object.values(resolvedSources)) {
    const path = inputPath(widget);
    if (path !== undefined) {
      paths.add(path);
    }
  }
  return paths;
}

function keepLiveKeys<T>(
  record: Record<string, T>,
  isLive: (key: string) => boolean,
): Record<string, T> {
  const liveKeys = Object.keys(record).filter(isLive);
  if (liveKeys.length === Object.keys(record).length) {
    return record;
  }
  const kept: Record<string, T> = {};
  for (const key of liveKeys) {
    kept[key] = record[key];
  }
  return kept;
}
