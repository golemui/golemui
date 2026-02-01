import * as Core from '@golemui/core';

export const loggerMiddleware: Core.Middleware<Core.State, Core.Action> =
  ({ getState }) =>
  (next) =>
  (action) => {
    const prevState = getState();
    const start = performance.now();

    let result: unknown;
    let error: unknown;

    try {
      result = next(action);
    } catch (err) {
      error = err;
    }

    const durationMs = performance.now() - start;

    if (error) {
      console.error(`%c[STORE ERROR]%c - ${action.type} - (${durationMs.toFixed(2)} ms)`, error);
      throw error;
    }

    const nextState = getState();
    const diffs = diffState(prevState, nextState);

    if (diffs.length === 0) {
      console.log(
        `%c${action.type}%c (${durationMs.toFixed(2)}ms) No Diffs`,
        'font-weight: bold;',
        'font-weight: normal;',
      );
      return result;
    }

    console.groupCollapsed(action.type);
    console.log('Duration (ms)', durationMs.toFixed(2));
    console.log('Diffs', diffs);
    console.groupEnd();

    return result;
  };

type Diff = { path: string; before: unknown; after: unknown };

const diffState = (prev: any, next: any, basePath = ''): Diff[] => {
  if (Object.is(prev, next)) {
    return [];
  }

  if (typeof prev !== 'object' || typeof next !== 'object' || prev === null || next === null) {
    return [{ path: basePath, before: prev, after: next }];
  }

  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  const diffs: Diff[] = [];

  for (const key of keys) {
    const path = basePath ? `${basePath}.${key}` : key;
    diffs.push(...diffState(prev[key], next[key], path));
  }

  return diffs;
};
