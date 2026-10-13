import { useEffect } from 'react';
import { useDraftText, type DraftText } from './useDraftText';

/** Options for {@link useTextCursor}. */
export type TextCursorOptions = {
  /** The value held by the form store. */
  value: string | undefined;
  /** Whether the widget holds focus. An unfocused widget shows the store value as it is. */
  isFocused: boolean;
  /** Called with the full text after every edit, like the DOM `input` event. */
  onValueChanged: (text: string) => void;
};

/**
 * Keeps the edited text and the caret position of a single-line input that shows a store value.
 *
 * Every edit calls `onValueChanged` with the whole text, which matches what the DOM widget set
 * does on each `input` event. While the widget is not focused the store value wins, so a host
 * calling `setData` replaces what is shown.
 *
 * @param options - The store value, the focus state, and the change callback.
 * @returns The current text, the caret index, and the key handler.
 *
 * @example
 * const { text, cursor, handleKey } = useTextCursor({ value, isFocused, onValueChanged });
 * useFocusedInput((input, key) => { handleKey(input, key); });
 */
export function useTextCursor({ value, isFocused, onValueChanged }: TextCursorOptions): DraftText {
  const storeText = value ?? '';
  const draft = useDraftText({ initialText: storeText, onTextChanged: onValueChanged });
  const { setText } = draft;

  useEffect(() => {
    if (!isFocused) {
      setText(storeText);
    }
  }, [storeText, isFocused, setText]);

  return draft;
}
