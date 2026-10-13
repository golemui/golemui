import { type Key } from 'ink';
import { useCallback, useRef, useState } from 'react';

/** The edited text and the caret position inside it. */
export type DraftTextState = {
  text: string;
  /** Index of the character the caret sits before. Ranges from 0 to `text.length`. */
  cursor: number;
};

/** What {@link useDraftText} returns. */
export type DraftText = DraftTextState & {
  /**
   * Applies one key press to the draft.
   *
   * @returns True when the key changed the text or moved the caret.
   */
  handleKey: (input: string, key: Key) => boolean;
  /** Replaces the whole draft and puts the caret at the end. */
  setText: (text: string) => void;
};

function isControlCharacter(text: string): boolean {
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

/** Reports whether a key press is a character a text field should insert. */
function isPrintableInput(input: string, key: Key): boolean {
  if (input.length === 0 || key.ctrl || key.meta) {
    return false;
  }
  return !isControlCharacter(input);
}

function applyKey(current: DraftTextState, input: string, key: Key): DraftTextState {
  const { text, cursor } = current;
  if (key.leftArrow) {
    return { text, cursor: Math.max(0, cursor - 1) };
  }
  if (key.rightArrow) {
    return { text, cursor: Math.min(text.length, cursor + 1) };
  }
  if (key.home) {
    return { text, cursor: 0 };
  }
  if (key.end) {
    return { text, cursor: text.length };
  }
  if (key.backspace) {
    if (cursor === 0) {
      return current;
    }
    return { text: text.slice(0, cursor - 1) + text.slice(cursor), cursor: cursor - 1 };
  }
  if (key.delete) {
    if (cursor >= text.length) {
      return current;
    }
    return { text: text.slice(0, cursor) + text.slice(cursor + 1), cursor };
  }
  if (isPrintableInput(input, key)) {
    return {
      text: text.slice(0, cursor) + input + text.slice(cursor),
      cursor: cursor + input.length,
    };
  }
  return current;
}

/** Options for {@link useDraftText}. */
export type DraftTextOptions = {
  /** The text the draft starts with. The caret starts at its end. */
  initialText?: string;
  /** Called with the whole text after every edit that changed it. */
  onTextChanged?: (text: string) => void;
};

/**
 * Keeps one line of text and the caret position inside it.
 *
 * The hook owns the text, so the widget decides when the text is committed and when it is
 * dropped. A text input mirrors the store value through {@link useTextCursor}, which is built on
 * this hook.
 *
 * @param options - The initial text and the change callback.
 * @returns The text, the caret index, the key handler and a setter.
 *
 * @example
 * const draft = useDraftText({ onTextChanged: (text) => onFilter(text) });
 * useFocusedInput((input, key) => { draft.handleKey(input, key); });
 */
export function useDraftText({
  initialText = '',
  onTextChanged,
}: DraftTextOptions = {}): DraftText {
  // The authoritative copy lives in a ref so two key events in one tick both read the newest text.
  const stateRef = useRef<DraftTextState>({ text: initialText, cursor: initialText.length });
  const [state, setState] = useState<DraftTextState>(stateRef.current);

  const onTextChangedRef = useRef(onTextChanged);
  onTextChangedRef.current = onTextChanged;

  const handleKey = useCallback((input: string, key: Key): boolean => {
    const next = applyKey(stateRef.current, input, key);
    if (next === stateRef.current) {
      return false;
    }
    const textChanged = next.text !== stateRef.current.text;
    stateRef.current = next;
    setState(next);
    if (textChanged) {
      onTextChangedRef.current?.(next.text);
    }
    return true;
  }, []);

  const setText = useCallback((text: string) => {
    if (stateRef.current.text === text) {
      return;
    }
    stateRef.current = { text, cursor: text.length };
    setState(stateRef.current);
  }, []);

  return { text: state.text, cursor: state.cursor, handleKey, setText };
}
