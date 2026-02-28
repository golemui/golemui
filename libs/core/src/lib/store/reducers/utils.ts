import { DotPath } from '../../shared';
import { State } from '../model';

/**
 * Conditionally applies a reducer function based on a predicate
 *
 * This higher-order reducer creates a new reducer that only applies the given
 * reducer function when the predicate function returns true for the current state.
 * If the predicate returns false, the state is returned unchanged.
 *
 * @param predicate - A function that takes the current state and returns a boolean
 * indicating whether the reducer should be applied
 * @param reducerFn - The reducer function to apply when the predicate returns true
 *
 * @returns A new reducer function that conditionally applies the given reducer
 *
 * @example
 * ```typescript
 * // Only increment if count is less than 10
 * const conditionalIncrement = reduceIf(
 *   (state: { count: number }) => state.count < 10,
 *   (state) => ({ ...state, count: state.count + 1 })
 * );
 *
 * conditionalIncrement({ count: 5 }); // returns { count: 6 }
 * conditionalIncrement({ count: 10 }); // returns { count: 10 } (unchanged)
 * ```
 */
export const reduceIf =
  (predicate: (state: State) => boolean, reducerFn: (state: State) => State) =>
  (state: State): State => {
    if (predicate(state)) {
      return reducerFn(state);
    }
    return state;
  };

export const isControlTouched =
  (widgetPath: DotPath) =>
  (state: State): boolean => {
    const touched = state.touchedControls[widgetPath];
    return state.touched && touched;
  };

export const hasWhen = (val: unknown): val is { when: string } => {
  return val !== undefined && typeof val === 'object' && val !== null && 'when' in val;
};
