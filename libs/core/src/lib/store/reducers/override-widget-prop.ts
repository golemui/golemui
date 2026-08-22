import { inputPath } from '../../utils/form';
import type { OVERRIDE_WIDGET_PROP } from '../actions';
import { type State } from '../model';

/**
 * Stores a prop override for one widget, addressed by uid or by the path its input owns.
 *
 * The target is looked up in `resolvedSources`, not in `calculatedWidgets`, so a hidden widget can
 * be addressed too. The props pass applies the stored value on the derive that reveals it.
 */
export const overrideWidgetProp = (state: State, { payload }: OVERRIDE_WIDGET_PROP): State => {
  const uid =
    'path' in payload ? findUidByPath(state, payload.path) : findUidByUid(state, payload.uid);
  if (uid === undefined) {
    return state;
  }

  const propOverrides = state.widgetPropOverrides[uid] || {};
  return {
    ...state,
    widgetPropOverrides: {
      ...state.widgetPropOverrides,
      [uid]: { ...propOverrides, [payload.prop]: payload.value },
    },
  };
};

function findUidByUid(state: State, uid: string): string | undefined {
  if (uid in state.resolvedSources) {
    return uid;
  }
  console.warn(`Widget with uid "${uid}" not found`);
  return undefined;
}

function findUidByPath(state: State, path: string): string | undefined {
  // Visible widgets first, so a visible owner of the path wins, and so a function widget whose
  // source declares no path is still found through the input shape it returns in `current`.
  const calculated = Object.values(state.calculatedWidgets).find(
    ({ source, current }) => (inputPath(current) ?? inputPath(source)) === path,
  );
  if (calculated) {
    return calculated.source.uid as string;
  }

  const hidden = Object.keys(state.resolvedSources).find(
    (uid) => inputPath(state.resolvedSources[uid]) === path,
  );
  if (hidden !== undefined) {
    return hidden;
  }

  console.warn(`Input with path "${path}" not found`);
  return undefined;
}
