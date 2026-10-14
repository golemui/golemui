import { useEffect, useEffectEvent, useRef } from 'react';
import { useFocusManager } from './focus/FocusManager';
import { useFocusPath } from './focus/FocusPathContext';

/** Options for {@link useFieldFocus}. */
export type FieldFocusOptions = {
  /** The widget uid, which is also its focus id. */
  uid: string;
  /** A disabled field stays registered but the tab order skips it. */
  isDisabled?: boolean;
  /** Called once when this field loses focus. Wire it to the adapter's `onBlur`. */
  onBlur?: () => void;
};

/**
 * Registers a widget with the form focus manager and reports blur. The widget reads its keys with
 * `useFocusedInput`.
 *
 * The widget is registered under the path it renders at, so the tab order follows the tree and a
 * widget that mounts later is reached where it is drawn.
 *
 * There is no blur event, so this compares the focus flag of the previous render with the current
 * one and calls `onBlur` on the true to false transition. That is what turns Tab into the
 * blur validation the form engine expects.
 *
 * @param options - The widget uid, its disabled state, and the blur callback.
 * @returns The focus flag, and `focusNext`, which a widget calls to leave the field on Enter.
 *
 * @example
 * const { isFocused, focusNext } = useFieldFocus({ uid, isDisabled, onBlur });
 * useFocusedInput(uid, {
 *   onKey: (input, key) => {
 *     if (key.return) { focusNext(); }
 *   },
 * });
 */
export function useFieldFocus({ uid, isDisabled, onBlur }: FieldFocusOptions) {
  const { activeUid, register, unregister, focusNext } = useFocusManager();
  const path = useFocusPath();
  const isFocused = activeUid === uid;

  // `register` also updates a widget that is already there, which is what a path change needs: a
  // sibling hidden by `when` moves every widget after it one position up without remounting it.
  useEffect(() => {
    register(uid, path, !isDisabled);
  }, [uid, path, isDisabled, register]);

  // Unregistering belongs to its own effect. Running it as the cleanup of the effect above would
  // drop the widget out of the order on every path change.
  useEffect(() => {
    return () => {
      unregister(uid);
    };
  }, [uid, unregister]);

  const onBlurEvent = useEffectEvent(() => {
    onBlur?.();
  });

  const wasFocused = useRef(isFocused);
  useEffect(() => {
    if (wasFocused.current && !isFocused) {
      onBlurEvent();
    }
    wasFocused.current = isFocused;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- eslint-plugin-react-hooks 5.0.0 predates useEffectEvent and asks for the Effect Event as a dependency.
  }, [isFocused]);

  return { isFocused, focusNext };
}
