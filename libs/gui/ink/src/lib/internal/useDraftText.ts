import { type Key } from 'ink';
import { useCallback, useRef, useState } from 'react';
import { nextGraphemeIndex, previousGraphemeIndex } from './graphemes';

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
  /**
   * Inserts a pasted text at the caret. Line breaks and other control characters are removed,
   * because the draft is one line.
   *
   * @returns True when the text changed.
   */
  insertText: (text: string) => boolean;
  /** Replaces the whole draft and puts the caret at the end. */
  setText: (text: string) => void;
};

// Covers CR and LF, which the browser also strips from a pasted text input value. A terminal
// cannot draw the other control characters.
function withoutControlCharacters(text: string): string {
  let result = '';
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0;
    if (code >= 32 && code !== 127) {
      result += character;
    }
  }
  return result;
}

function insertAtCursor(current: DraftTextState, insertedText: string): DraftTextState {
  const { text, cursor } = current;
  const cleanText = withoutControlCharacters(insertedText);
  if (cleanText === '') {
    return current;
  }
  return {
    text: text.slice(0, cursor) + cleanText + text.slice(cursor),
    cursor: cursor + cleanText.length,
  };
}

function applyKey(current: DraftTextState, input: string, key: Key): DraftTextState {
  const { text, cursor } = current;
  if (key.leftArrow) {
    return { text, cursor: previousGraphemeIndex(text, cursor) };
  }
  if (key.rightArrow) {
    return { text, cursor: nextGraphemeIndex(text, cursor) };
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
    const start = previousGraphemeIndex(text, cursor);
    return { text: text.slice(0, start) + text.slice(cursor), cursor: start };
  }
  if (key.delete) {
    if (cursor >= text.length) {
      return current;
    }
    const end = nextGraphemeIndex(text, cursor);
    return { text: text.slice(0, cursor) + text.slice(end), cursor };
  }
  if (input.length === 0 || key.ctrl || key.meta) {
    return current;
  }
  // An input of several characters is a paste from a terminal without bracketed paste.
  return insertAtCursor(current, input);
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
 * `handleKey` and `insertText` are new functions on every render. Call them from the handlers of
 * `useFocusedInput`, which always run the last render.
 *
 * @param options - The initial text and the change callback.
 * @returns The text, the caret index, the key and paste handlers, and a setter.
 *
 * @example
 * const draft = useDraftText({ onTextChanged: (text) => onFilter(text) });
 * useFocusedInput(uid, {
 *   onKey: (input, key) => { draft.handleKey(input, key); },
 *   onPaste: (text) => { draft.insertText(text); },
 * });
 */
export function useDraftText({
  initialText = '',
  onTextChanged,
}: DraftTextOptions = {}): DraftText {
  // The authoritative copy lives in a ref so two key events in one tick both read the newest text.
  const stateRef = useRef<DraftTextState>({ text: initialText, cursor: initialText.length });
  const [state, setState] = useState<DraftTextState>(stateRef.current);

  function applyChange(next: DraftTextState): boolean {
    if (next === stateRef.current) {
      return false;
    }
    const textChanged = next.text !== stateRef.current.text;
    stateRef.current = next;
    setState(next);
    if (textChanged) {
      onTextChanged?.(next.text);
    }
    return true;
  }

  function handleKey(input: string, key: Key): boolean {
    return applyChange(applyKey(stateRef.current, input, key));
  }

  function insertText(text: string): boolean {
    return applyChange(insertAtCursor(stateRef.current, text));
  }

  // Stable, because a widget calls it from an effect that lists it as a dependency.
  const setText = useCallback((text: string) => {
    if (stateRef.current.text === text) {
      return;
    }
    stateRef.current = { text, cursor: text.length };
    setState(stateRef.current);
  }, []);

  return { text: state.text, cursor: state.cursor, handleKey, insertText, setText };
}
