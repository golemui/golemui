import { useEffect, useEffectEvent } from 'react';
import { useFocusManager, type KeyHandler, type PasteHandler } from './focus/FocusManager';

/** The handlers of {@link useFocusedInput}. */
export type FocusedInputHandlers = {
  /** Receives every key except Tab, which the form uses to move the focus. */
  onKey: KeyHandler;
  /** Receives a pasted text in one piece, line breaks included. Omit it to ignore pastes. */
  onPaste?: PasteHandler;
};

/**
 * Hands the keys and the pastes of a widget to its handlers while the widget holds the focus.
 *
 * The form reads the keyboard once and gives each key only to the widget that is focused when the
 * key arrives. The handlers always run with the props and the state of the last render.
 *
 * @param uid - The widget uid, the same one the widget passes to `useFieldFocus`.
 * @param handlers - The key handler and the optional paste handler.
 *
 * @example
 * const { isFocused, focusNext } = useFieldFocus({ uid, isDisabled, onBlur });
 * useFocusedInput(uid, {
 *   onKey: (input, key) => {
 *     if (key.return) { focusNext(); }
 *   },
 * });
 */
export function useFocusedInput(uid: string, { onKey, onPaste }: FocusedInputHandlers) {
  const { setInputHandlers } = useFocusManager();
  const onKeyEvent = useEffectEvent(onKey);
  const onPasteEvent = useEffectEvent((text: string) => {
    onPaste?.(text);
  });

  useEffect(() => {
    // The manager calls these from Ink's input event, the way an effect hands a callback to an
    // event source outside React.
    setInputHandlers(uid, {
      handleKey: (input, key) => onKeyEvent(input, key),
      handlePaste: (text) => onPasteEvent(text),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- eslint-plugin-react-hooks 5.0.0 predates useEffectEvent and asks for the Effect Events as dependencies.
  }, [uid, setInputHandlers]);
}
