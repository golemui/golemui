import { useCallback, useEffect, useRef } from 'react';
import { useFocusManager, type KeyHandler } from './focus/FocusManager';
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

/** A key handler, called only while the widget holds focus. */
export type FieldKeyHandler = KeyHandler;

/**
 * Registers a widget with the form focus manager, reports blur, and hands back the hook a widget
 * uses to read keys.
 *
 * The widget is registered under the path it renders at, so the tab order follows the tree and a
 * widget that mounts later is reached where it is drawn.
 *
 * There is no blur event, so this compares the focus flag of the previous render with the current
 * one and calls `onBlur` on the true to false transition. That is what turns Tab into the
 * blur validation the form engine expects.
 *
 * @param options - The widget uid, its disabled state, and the blur callback.
 * @returns The focus flag, `useFocusedInput`, which runs a handler for the focused widget, and
 * `focusNext`, which a widget calls to leave the field on Enter.
 *
 * @example
 * const { isFocused, useFocusedInput, focusNext } = useFieldFocus({ uid, isDisabled, onBlur });
 * useFocusedInput((input, key) => {
 *   if (key.return) { focusNext(); }
 * });
 */
export function useFieldFocus({ uid, isDisabled, onBlur }: FieldFocusOptions) {
  const { activeUid, register, unregister, focusNext } = useFocusManager();
  const path = useFocusPath();
  const isFocused = activeUid === uid;

  // The manager keeps this wrapper, so it always calls the handler of the last render.
  const handlerRef = useRef<FieldKeyHandler | undefined>(undefined);
  const handleKey = useCallback<FieldKeyHandler>((input, key) => {
    handlerRef.current?.(input, key);
  }, []);

  // `register` also updates a widget that is already there, which is what a path change needs: a
  // sibling hidden by `when` moves every widget after it one position up without remounting it.
  useEffect(() => {
    register(uid, path, !isDisabled, handleKey);
  }, [uid, path, isDisabled, register, handleKey]);

  // Unregistering belongs to its own effect. Running it as the cleanup of the effect above would
  // drop the widget out of the order on every path change.
  useEffect(() => {
    return () => {
      unregister(uid);
    };
  }, [uid, unregister]);

  // The callback identity changes on every render, so it is read from a ref and never
  // re-triggers the transition effect.
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const wasFocused = useRef(isFocused);
  useEffect(() => {
    if (wasFocused.current && !isFocused) {
      onBlurRef.current?.();
    }
    wasFocused.current = isFocused;
  }, [isFocused]);

  /**
   * Sets the handler for the keys this widget receives while it holds the focus. Call it on every
   * render.
   *
   * The form reads the keyboard once and hands each key to the focused widget only. Tab never
   * arrives here, because the form uses it to move the focus.
   *
   * @param handler - Called with the Ink input string and key flags.
   */
  function useFocusedInput(handler: FieldKeyHandler) {
    handlerRef.current = handler;
  }

  return { isFocused, useFocusedInput, focusNext };
}
