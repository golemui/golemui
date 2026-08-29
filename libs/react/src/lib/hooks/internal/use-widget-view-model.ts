import {
  createWidgetViewModelReader,
  type FormContext,
  type WidgetViewModel,
  type WithWidget,
} from '@golemui/core';
import { useMemo, useState, useSyncExternalStore } from 'react';

type FormStore = FormContext<React.ComponentType<WithWidget>>['store'];
type Uid = WidgetViewModel['uid'];

/**
 * Reads one widget's view model from the store with `useSyncExternalStore`, so the value
 * is available during the first render (a server render has no other chance to read it).
 * The memoizing reader returns the identical object until one of the widget's state
 * slices changes, which is what makes the snapshot `Object.is`-comparable.
 */
export function useWidgetViewModel<T = unknown>(store: FormStore, uid: Uid): WidgetViewModel<T> {
  // Created once and kept for the hook instance's whole lifetime. Its cache is keyed by
  // uid, so a repeater-row uid change just adds an entry, and a store replacement
  // remounts the tree anyway.
  const [readViewModel] = useState(() => createWidgetViewModelReader());

  const subscribe = useMemo(
    () => (onStoreChange: () => void) => {
      const subscription = store.state$.subscribe(onStoreChange);
      return () => subscription.unsubscribe();
    },
    [store],
  );

  const getSnapshot = () => readViewModel<T>(store.getState(), uid);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Accumulates a per-widget render value across view-model changes. The widget hooks need
 * this because a hidden widget has no calculated widget, and the last visible values must
 * stay on screen.
 *
 * This is React's "adjusting state when props change" pattern: the state update happens
 * during render, never in an effect, so the first render (the only render on a server)
 * already returns the fully accumulated result.
 *
 * @param viewModel - The current view model, reference-stable between changes.
 * @param accumulate - Combines the previous result (or `undefined` on the first render)
 * with the current view model. Runs exactly once per distinct view model.
 * @returns The accumulated result for the current view model.
 */
export function useViewModelAccumulator<Result>(
  viewModel: WidgetViewModel,
  accumulate: (previous: Result | undefined, viewModel: WidgetViewModel) => Result,
): Result {
  const [accumulated, setAccumulated] = useState(() => ({
    viewModel,
    result: accumulate(undefined, viewModel),
  }));

  let result = accumulated.result;
  if (accumulated.viewModel !== viewModel) {
    result = accumulate(accumulated.result, viewModel);
    setAccumulated({ viewModel, result });
  }
  return result;
}
